import {ethers, providers} from "ethers";
import {hash as namehash} from "@ensdomains/eth-ens-namehash";
import {formatsByName} from '@ensdomains/address-encoder'
import {EMPTY_ADDRESS, getResolverContract} from "./base";
import {decodeContenthash} from "./contents";
import {dnsWireNameHash, dnsWireName} from "./dnsUtils";
import {Buffer} from "buffer";

type Content = {
  contentType: 'error' | 'contenthash' | 'oldcontent',
  value: string | null
}

async function getContentWithResolver(name: string, resolverAddr: string | null, provider: providers.BaseProvider): Promise<Content> {
  const nh = namehash(name)
  if (!resolverAddr) {
    return {
      contentType: "error",
      value: 'Resolver address missing'
    }
  }
  try {
    const Resolver = getResolverContract({
      address: resolverAddr,
      provider,
    })
    const contentHashSignature = ethers.utils.solidityKeccak256(['string'], ['contenthash(bytes32)']).slice(0, 10)

    const isContentHashSupported = await Resolver.supportsInterface(contentHashSignature)

    if (!isContentHashSupported) {
      const value = await Resolver.content(nh)
      return {
        value,
        contentType: 'oldcontent',
      }
    }
    const encoded = await Resolver.contenthash(nh)
    if (encoded === '0x') {
      return {
        contentType: "contenthash",
        value: null
      }
    }
    const {protocolType, decoded, error} = decodeContenthash(encoded)
    if (error) {
      return {
        value: 'Failed to decode content',
        contentType: 'error',
      }
    }
    return {
      value: `${protocolType}://${decoded}`,
      contentType: 'contenthash',
    }
  } catch (e) {
    const message =
      'Error getting content on the resolver contract, are you sure the resolver address is a resolver contract?'
    console.warn(message, e)
    return {
      value: message,
      contentType: 'error'
    }
  }
}

type NameConfig = {
  name: string
  provider: providers.BaseProvider
  ens: ethers.Contract
  signer?: ethers.Signer
}

export default class Name {
  readonly name: string
  readonly namehash: string
  private readonly provider: providers.BaseProvider
  private readonly ens: ethers.Contract
  //private readonly ensWithSigner: ethers.Contract
  private readonly signer?: ethers.Signer
  private resolverAddress?: string;

  constructor(options: NameConfig) {
    const {name, ens, provider, signer} = options
    this.ens = ens
    //this.ensWithSigner = this.ens.connect(signer)
    this.name = name
    this.namehash = namehash(name)
    this.provider = provider
    this.signer = signer
  }

  async getOwner() {
    return this.ens.owner(this.namehash)
  }

  async hasResolver(): Promise<boolean> {
    const resolverArrd = await this.getResolverAddr()
    return !!resolverArrd
  }

  async getTTL() {
    return this.ens.ttl(this.namehash)
  }

  /**
   * Return resolver contract address
   * @param forceRefresh - if true will query blockchain for address even if we have it
   */
  async getResolverAddr(forceRefresh = false): Promise<string | null> {
    if(this.resolverAddress && !forceRefresh){
      return this.resolverAddress;
    }
    const address = await this.ens.resolver(this.namehash)
    if(parseInt(address, 16) === 0){
      return null;
    }
    this.resolverAddress = address;
    return address
  }

  /**
   * Get resolver contract instance
   * @param writable - writable instance will allow calling methods that change data
   */
  async getResolver(writable = false): Promise<ethers.Contract | null> {
    const resolverAddr = await this.getResolverAddr();
    if(!resolverAddr){
      return null;
    }
    if(writable){
      if(!this.signer){
        throw new Error('Name is initialized in read-only mode. Provide signer to write data.')
      }
      return getResolverContract({
        address: resolverAddr,
        provider: this.signer,
      })
    }
    return getResolverContract({
      address: resolverAddr,
      provider: this.provider,
    })
  }

  /**
   * Get Ethereum or other blockchain address associated with name
   * @param coinId
   */
  async getAddress(coinId?: string): Promise<string> {
    const Resolver = await this.getResolver();
    if (!Resolver) return EMPTY_ADDRESS
    if (!coinId) {
      return Resolver['addr(bytes32)'](this.namehash)
    }
    try {
      const {coinType, encoder} = formatsByName[coinId]
      const addr = await Resolver['addr(bytes32,uint256)'](this.namehash, coinType)
      if (addr === '0x') {
        return EMPTY_ADDRESS
      }
      return encoder(Buffer.from(addr.slice(2), 'hex'))
    } catch (e) {
      console.log(e)
      console.warn(
        'Error getting addr on the resolver contract, are you sure the resolver address is a resolver contract?'
      )
      return EMPTY_ADDRESS
    }
  }

  async getContent() {
    const resolverAddr = await this.getResolverAddr()
    return getContentWithResolver(this.name, resolverAddr, this.provider)
  }

  async getText(key: string): Promise<string> {
    const Resolver = await this.getResolver()
    if (!Resolver) {
      return ''
    }
    try {
      return Resolver.text(this.namehash, key)
    } catch (e) {
      console.warn(
        'Error getting text record on the resolver contract, are you sure the resolver address is a resolver contract?'
      )
      return ''
    }
  }

  //TODO: This is not working properly currently. Looks like in go-ens it is broken too
  async hasDNS() {
    const Resolver = await this.getResolver()
    if(!Resolver){
      return false
    }
    return Resolver.hasDNSRecords(this.namehash, ethers.utils.keccak256(dnsWireName(this.namehash)))
  }

  /**
   * Write DNS data in binary wire format
   * @param data - DNS records encoded in binary format
   */
  async setDNS(data: Buffer) {
    if(!this.signer){
      throw new Error('Name is initialized in read-only mode. Provide signer to write data.')
    }
    const Resolver = await this.getResolver(true)
    if(!Resolver){
      throw new Error(`No resolver found for name ${this.name}`)
    }
    return Resolver.setDNSRecords(this.namehash, data)
  }

  /**
   * Get DNS records of given type. Records are in binary format.
   * @param type
   */
  async getDNS(type: number): Promise<Buffer | null> {
    const Resolver = await this.getResolver();
    if(!Resolver){
      return null
    }
    const data = await Resolver.dnsRecord(this.namehash, dnsWireNameHash(this.name), type);
    return Buffer.from(data.replace('0x', ''),'hex');
  }
}
