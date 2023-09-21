import { ethers, providers } from 'ethers';
import { formatsByName } from '@ensdomains/address-encoder';
import { decode, encode } from './utils/content.js';
import { dnsWireNameHash } from './utils/dns.js';
import { Buffer } from 'buffer';
import { getContract } from './contracts/index.js';

import { Network } from './types/common.js';
import { hashName } from './utils/name.js';

const NO_DATA = '0x';

type NameConfig = {
  name: string;
  provider: providers.BaseProvider;
  registry: ethers.Contract;
  network: Network;
  signer?: ethers.Signer;
};

export default class DWEBName {
  readonly name: string;
  readonly namehash: string;
  private readonly provider: providers.BaseProvider;
  private readonly registryContract: ethers.Contract;
  private readonly network: Network;
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
  }

  async getOwner(): Promise<string> {
    return this.registryContract['owner(bytes32)'](this.namehash);
  }

  async hasResolver(): Promise<boolean> {
    const resolverArrd = await this.getResolverAddr();
    return !!resolverArrd;
  }

  async getTTL() {
    return this.registryContract.ttl(this.namehash);
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

  async setText(key: string, value: string): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    return Resolver.setText(this.namehash, key, value);
  }

  //TODO: This is not working properly currently. Looks like in go-ens it is broken too
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
  async setContenthash(contentUrl: string | null): Promise<providers.TransactionResponse> {
    const Resolver = await this.getResolver(true);
    if (!Resolver) {
      throw new Error(`No resolver found for name ${this.name}`);
    }
    const data = contentUrl ? encode(contentUrl) : Buffer.from('');
    return Resolver.setContenthash(this.namehash, data);
  }

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
