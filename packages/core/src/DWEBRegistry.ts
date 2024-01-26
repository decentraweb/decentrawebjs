import { ethers, providers } from 'ethers';
import DWEBName from './DWEBName';
import { DEFAULT_TTL } from './utils/contracts';
import { getContract } from './contracts';
import { isValidDomain } from './utils/dns';
import { DwebConfig } from './types/common';
import DwebContractWrapper, { requiresSigner } from './DwebContractWrapper';
import { hashName } from './utils';
import DecentrawebGraph from './graph';

export default class DWEBRegistry extends DwebContractWrapper {
  constructor(options: DwebConfig) {
    super(options, 'DWEBRegistry');
  }

  /**
   * Create instance of DWEBName to read/write data for specific domain name
   * @param name - domain name you would like to work with
   */
  name(name: string) {
    return new DWEBName({
      name,
      registry: this.contract,
      provider: this.provider,
      network: this.network,
      signer: this.signer
    });
  }

  /**
   * Check if domain name exists. Note that name could be located on Ethereum or Polygon network.
   * If name is currently on Polygon, it will not exist on Ethereum and vice versa.
   * @param name
   */
  async nameExists(name: string): Promise<boolean> {
    const hash = hashName(name);
    try {
      await this.contract['owner(bytes32)'](hash);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Assign default resolver contract to domain name. This is usually done during the registration process, but may be
   * required if domain has no resolver set or if it is no compatible with Decentraweb.
   * @param name
   */
  @requiresSigner
  async assignDefaultResolver(name: string): Promise<providers.TransactionResponse> {
    const hash = hashName(name);
    return this.contract.setResolverAndTTL(hash, this.contractConfig.PublicResolver, DEFAULT_TTL);
  }

  /**
   * Set resolver contract for domain name. May be used to assign domain custom resolver contract.
   *
   * Be careful as this may break domain functionality if resolver contract is not compatible with Decentraweb.
   * @param name - domain name you would like to work assign resolver to
   * @param address - address of resolver contract
   */
  @requiresSigner
  async setResolver(name: string, address: string): Promise<providers.TransactionResponse> {
    const hash = hashName(name);
    return this.contract.setResolver(hash, address);
  }

  /**
   * Get reverse record for address.
   *
   * Important: address owner can set any name for his address, even if he doesn't own it, or it is not registered.
   * To check that name is valid, we check that it resolves to the same address.
   * @param address
   * @param skipForwardCheck -  by default we check that returned name resolves to the same address. Set this to true to skip this check.
   */
  async getReverseRecord(address: string, skipForwardCheck = false): Promise<string | null> {
    const reverseName = `${address.slice(2)}.addr.reverse`;
    const reverseHash = hashName(reverseName);
    const resolverAddr = await this.contract.resolver(reverseHash);
    if (parseInt(resolverAddr, 16) === 0) {
      return null;
    }
    const resolver = getContract({
      address: resolverAddr,
      name: 'DefaultReverseResolver',
      provider: this.provider,
      network: this.network
    });
    const domain = await resolver.name(reverseHash);
    if (!domain || !isValidDomain(domain)) {
      return null;
    }
    if (!skipForwardCheck) {
      const name = this.name(domain);
      const ethAddress = await name.getAddress('ETH');
      if (ethAddress !== address) {
        return null;
      }
    }
    return domain;
  }

  /**
   * Set reverse record for signer address. Don't forget to also assign this address to name.
   * @param name
   */
  @requiresSigner
  async setReverseRecord(name: string): Promise<providers.TransactionResponse> {
    const signer = this.signer as ethers.Signer;
    const reverseRegistrar = getContract({
      address: this.contractConfig.ReverseRegistrar,
      name: 'ReverseRegistrar',
      provider: signer,
      network: this.network
    });
    return reverseRegistrar.setName(name);
  }

  /**
   * Get all domains owned by address on current network
   * @param address - Ethereum address
   * @param skip
   * @param limit
   */
  getOwnedDomains(address: string, skip: number, limit: number) {
    const graph = new DecentrawebGraph(this.network);
    return graph.getOwnedDomains(address, skip, limit);
  }
}
