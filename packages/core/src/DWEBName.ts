import { BigNumber, ethers, providers } from 'ethers';
import { formatsByName } from '@ensdomains/address-encoder';
import { decode, encode } from './utils/content';
import { dnsWireNameHash } from './utils/dns';
import { Buffer } from 'buffer';
import { getContract } from './contracts';
import { Network } from './types/common';
import { hashName } from './utils';
import { NotSupportedError } from './utils/errors';

const NO_DATA = '0x';

type NameConfig = {
  name: string;
  provider: providers.BaseProvider;
  registry: ethers.Contract;
  network: Network;
  signer?: ethers.Signer;
};

type Feature = 'address' | 'contentHash' | 'dns' | 'txt';

function ethereumOnly(target: any, ctx: DecoratorContext): any {
  return function (this: DWEBName, ...args: any[]) {
    if (this.network === 'matic' || this.network === 'maticmum') {
      throw new NotSupportedError(target.name, this.network);
    }
    return target.apply(this, args);
  };
}

export default class DWEBName {
  readonly name: string;
  readonly namehash: string;
  readonly network: Network;
  /**
   * Contains flags for features supported by the name on the network where it is located.
   */
  readonly features: Record<Feature, boolean>;

  private readonly provider: providers.BaseProvider;
  private readonly registryContract: ethers.Contract;
  private readonly signer?: ethers.Signer;
  private resolverAddress?: string;

  constructor(options: NameConfig) {
    const { name, registry, provider, network, signer } = options;
    this.registryContract = registry;
    this.name = name;
    this.namehash = hashName(name);
    this.provider = provider;
    this.network = network;
    this.signer = signer;
    const isMatic = this.network === 'matic' || this.network === 'maticmum';
    this.features = {
      address: true,
      contentHash: !isMatic,
      dns: !isMatic,
      txt: !isMatic
    };
  }

  async getOwner(): Promise<string> {
    return this.registryContract['owner(bytes32)'](this.namehash);
  }

  async hasResolver(): Promise<boolean> {
    const resolverArrd = await this.getResolverAddr();
    return !!resolverArrd;
  }

  /**
   * Get expiration date of the domain. Returns null if the domain has no expiration date.
   */
  async getExpirationDate(): Promise<Date | null> {
    const [result] = await this.registryContract['domainExpiryBatch(bytes32[])']([this.namehash]);
    const timestamp: number = result.toNumber();
    return timestamp ? new Date(timestamp * 1000) : null;
  }

  /**
   * Get time to live for the records in seconds.
   * Note that DNS records have TTL specified in the records themselves.
   */
  async getTTL(): Promise<number> {
    const ttl = (await this.registryContract.ttl(this.namehash)) as BigNumber;
    return ttl.toNumber();
  }

  /**
   * Return resolver contract address
   * @param forceRefresh - if true will query blockchain for address even if we have it
   */
  async getResolverAddr(forceRefresh = false): Promise<string | null> {
    if (this.resolverAddress && !forceRefresh) {
      return this.resolverAddress;
    }
    const address = await this.registryContract.resolver(this.namehash);
    if (parseInt(address, 16) === 0) {
      return null;
    }
    this.resolverAddress = address;
    return address;
  }

  /**
   * Get resolver contract instance
   * @param writable - writable instance will allow calling methods that change data
   */
  async getResolver(writable = false): Promise<ethers.Contract | null> {
    const resolverAddr = await this.getResolverAddr();
    if (!resolverAddr) {
      return null;
    }
    if (writable) {
      if (!this.signer) {
        throw new Error('Name is initialized in read-only mode. Provide signer to write data.');
      }
      return getContract({
        address: resolverAddr,
        name: 'PublicResolver',
        provider: this.signer,
        network: this.network
      });
    }
    return getContract({
      address: resolverAddr,
      name: 'PublicResolver',
      provider: this.provider,
      network: this.network
    });
  }

  /**
   * Get Ethereum or other blockchain address associated with name
   * @param coinId
   */
  async getAddress(coinId?: string): Promise<string | null> {
    const Resolver = await this.getResolver();
    if (!Resolver) return null;
    if (!coinId) {
      return Resolver['addr(bytes32)'](this.namehash);
    }
    try {
      const { coinType, encoder } = formatsByName[coinId];
      const addr = await Resolver['addr(bytes32,uint256)'](this.namehash, coinType);
      if (addr === '0x') {
        return null;
      }
      return encoder(Buffer.from(addr.slice(2), 'hex'));
    } catch (e) {
      console.log(e);
      console.warn(
        'Error getting address of the resolver contract, are you sure the resolver address is a resolver contract?'
      );
      return null;
    }
  }

  async setAddress(coinId: string, address: string): Promise<providers.TransactionResponse> {
    if (!coinId) {
      throw new Error('No coinId provided');
    }
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    const { decoder, coinType } = formatsByName[coinId.toUpperCase()];
    let addressAsBytes;
    if (!address) {
      //Special handling for ETH
      if (coinType === 60) {
        addressAsBytes = decoder('0x0000000000000000000000000000000000000000');
      } else {
        addressAsBytes = Buffer.alloc(0);
      }
    } else {
      addressAsBytes = decoder(address);
    }
    return Resolver['setAddr(bytes32,uint256,bytes)'](this.namehash, coinType, addressAsBytes);
  }

  /**
   * Get multiple coin addresses associated with name
   * @param coinIds - array of coinIds `['ETH', 'BTC']`
   */
  async getAddressBatch(
    coinIds: string[]
  ): Promise<{ id: string; type: number; success: boolean; address: string }[]> {
    const Resolver = await this.getResolver();
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    const ids = coinIds.map((id) => formatsByName[id.toUpperCase()].coinType);
    const [records] = await Resolver.getAllRecords([this.namehash], [ids]);
    return records.map((addr: string, i: number) => {
      const coinId = coinIds[i].toUpperCase();
      const { coinType, encoder } = formatsByName[coinId];
      try {
        return {
          id: coinId,
          success: true,
          type: coinType,
          address: addr === '0x' ? null : encoder(Buffer.from(addr.slice(2), 'hex'))
        };
      } catch (e) {
        console.log(e);
        console.warn('Error reading wallet address from the resolver contract.');
        return {
          id: coinId,
          success: false,
          type: null,
          address: null
        };
      }
    });
  }

  /**
   * Set multiple coin addresses associated with name in a single transaction.
   * @param data - map of coinId to address `{'ETH': '0x1234', 'BTC': 'bc1q...'}`
   */
  async setAddressBatch(data: Record<string, string>): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    const coinTypes: number[] = [];
    const addresses: Buffer[] = [];
    for (const [coinId, address] of Object.entries(data)) {
      const { decoder, coinType } = formatsByName[coinId.toUpperCase()];
      let addressAsBytes;
      if (!address) {
        //Special handling for ETH
        if (coinType === 60) {
          addressAsBytes = decoder('0x0000000000000000000000000000000000000000');
        } else {
          addressAsBytes = Buffer.alloc(0);
        }
      } else {
        addressAsBytes = decoder(address);
      }
      coinTypes.push(coinType);
      addresses.push(addressAsBytes);
    }
    return Resolver.setAllRecords([this.namehash], [coinTypes], [addresses]);
  }

  @ethereumOnly
  async getText(key: string): Promise<string> {
    const Resolver = await this.getResolver();
    if (!Resolver) {
      return '';
    }
    try {
      return Resolver.text(this.namehash, key);
    } catch (e) {
      console.warn(
        'Error getting text record on the resolver contract, are you sure the resolver address is a resolver contract?'
      );
      return '';
    }
  }

  @ethereumOnly
  async setText(key: string, value: string): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    return Resolver.setText(this.namehash, key, value);
  }

  //TODO: This is not working properly currently. Looks like in go-ens it is broken too
  @ethereumOnly
  async hasDNS() {
    const Resolver = await this.getResolver();
    if (!Resolver) {
      return false;
    }
    return Resolver.hasDNSRecords(this.namehash, dnsWireNameHash(this.namehash));
  }

  /**
   * Write DNS data in binary wire format
   * @param data - DNS records encoded in binary format
   */
  @ethereumOnly
  async setDNS(data: Buffer): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    return Resolver.setDNSRecords(this.namehash, data);
  }

  /**
   * Get DNS records of given type. Records are in binary format.
   * @param type
   */
  @ethereumOnly
  async getDNS(type: number): Promise<Buffer | null> {
    const Resolver = await this.getResolver();
    if (!Resolver) {
      return null;
    }
    const data = await Resolver.dnsRecord(this.namehash, dnsWireNameHash(this.name), type);
    return Buffer.from(data.replace('0x', ''), 'hex');
  }

  /**
   * Remove all DNS records for name
   */
  @ethereumOnly
  async clearDNS(): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    return Resolver.clearDNSZone(this.namehash);
  }

  /**
   * Samples:
   * 1. IPFS ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4
   * 2. Swarm bzz://d1de9994b4d039f6548d191eb26786769f580809256b4685ef316805265ea162
   *
   * @param contentUrl
   */
  @ethereumOnly
  async setContenthash(contentUrl: string | null): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    const data = contentUrl ? encode(contentUrl) : Buffer.from('');
    return Resolver.setContenthash(this.namehash, data);
  }

  @ethereumOnly
  async getContenthash(): Promise<string | null> {
    const Resolver = await this.getResolver();
    if (!Resolver) {
      return null;
    }
    const encoded = await Resolver.contenthash(this.namehash);
    if (encoded === NO_DATA) {
      return null;
    }
    return decode(encoded);
  }
}
