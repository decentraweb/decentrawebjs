import { providers, utils } from 'ethers';
import { getDomainProvider } from './lib/getDomainProvider';
import { DomainProvider, ToolkitConfig } from './types';
import { DWEBRegistry, Network } from '@decentraweb/core';

interface ResolutionResult {
  provider: DomainProvider;
  name: string;
}

export class EthereumAddress {
  readonly network: Network;
  readonly provider: providers.BaseProvider;
  protected dweb: DWEBRegistry;

  constructor(options: ToolkitConfig) {
    const { network, provider } = options;
    this.provider = provider;
    this.network = network;
    this.dweb = new DWEBRegistry(options);
  }

  /**
   * Find ethereum address by domain name
   * @param name
   */
  async lookup(name: string): Promise<string | null> {
    const domainProvider = await getDomainProvider(name);
    switch (domainProvider) {
      case 'dweb': {
        const dwebName = this.dweb.name(name);
        return dwebName.getAddress('ETH');
      }
      case 'ens':
        return this.provider.resolveName(name);
      default:
        return null;
    }
  }

  /**
   * Resolve Ethereum address to domain name
   * @param address valid ethereum address
   * @param domainProvider domain name provider to use. If omitted all supported providers will be used
   */
  async resolve(
    address: string,
    domainProvider?: DomainProvider
  ): Promise<ResolutionResult[] | string | null> {
    const checksumAddress = utils.getAddress(address);
    const result: ResolutionResult[] = [];
    if (!domainProvider || domainProvider === 'dweb') {
      const name = await this.dweb.getReverseRecord(checksumAddress);
      if (name) {
        result.push({
          provider: 'dweb',
          name: name
        });
      }
    }
    if (!domainProvider || domainProvider === 'ens') {
      const name = await this.provider.lookupAddress(checksumAddress);
      if (name) {
        result.push({
          provider: 'ens',
          name: name
        });
      }
    }
    return domainProvider ? result[0]?.name || null : result;
  }
}
