import { providers } from 'ethers';
import { hash as namehash } from '@ensdomains/eth-ens-namehash';
import DWEBName from './DWEBName';
import { DEFAULT_TTL } from './utils/contracts';
import { getContract } from './contracts';
import { isValidDomain } from './utils/dns';
import { DwebConfig } from './types/common';
import DwebContractWrapper, { requiresSigner } from './DwebContractWrapper';

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
      signer: this.signer
    });
  }

  @requiresSigner
  async assignDefaultResolver(name: string): Promise<providers.TransactionResponse> {
    const hash = namehash(name);
    return this.contract.setResolverAndTTL(hash, this.contractConfig.PublicResolver, DEFAULT_TTL);
  }

  @requiresSigner
  async setResolver(name: string, address: string): Promise<providers.TransactionResponse> {
    const hash = namehash(name);
    return this.contract.setResolver(hash, address);
  }

  async getReverseRecord(address: string, skipForwardCheck = false): Promise<string | null> {
    const reverseName = `${address.slice(2)}.addr.reverse`;
    const reverseHash = namehash(reverseName);
    const resolverAddr = await this.contract.resolver(reverseHash);
    if (parseInt(resolverAddr, 16) === 0) {
      return null;
    }
    const resolver = getContract({
      address: resolverAddr,
      name: 'DefaultReverseResolver',
      provider: this.provider
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

  @requiresSigner
  async setReverseRecord(name: string) {
    const reverseRegistrar = getContract({
      address: this.contractConfig.ReverseRegistrar,
      name: 'ReverseRegistrar',
      provider: this.provider
    });
    return reverseRegistrar.setName(name);
  }
}
