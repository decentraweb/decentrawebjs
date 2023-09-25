import { utils } from 'ethers';
import { getDomainProvider } from './lib/getDomainProvider';
import { DomainProvider, ToolkitConfig } from './types';
import { DWEBRegistry } from '@decentraweb/core';

interface ResolutionResult {
  provider: DomainProvider;
  name: string;
}

export class EthereumAddress {
  readonly ethereum: ToolkitConfig['ethereum'];
  readonly polygon: ToolkitConfig['polygon'];
  protected ethRegistry: DWEBRegistry;
  protected polygonRegistry: DWEBRegistry;

  constructor(options: ToolkitConfig) {
    this.ethereum = options.ethereum;
    this.polygon = options.polygon;
    this.ethRegistry = new DWEBRegistry(options.ethereum);
    this.polygonRegistry = new DWEBRegistry(options.polygon);
  }

  /**
   * Find ethereum address by domain name
   * @param name
   */
  async lookup(name: string): Promise<string | null> {
    const domainProvider = await getDomainProvider(name);
    switch (domainProvider) {
      case 'dweb': {
        const isNameOnEthereum = await this.ethRegistry.nameExists(name);
        const registry = isNameOnEthereum ? this.ethRegistry : this.polygonRegistry;
        return registry.name(name).getAddress('ETH');
      }
      case 'ens':
        return this.ethereum.provider.resolveName(name);
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
      let name = await this.ethRegistry.getReverseRecord(checksumAddress);
      if (!name) {
        name = await this.polygonRegistry.getReverseRecord(checksumAddress);
      }
      if (name) {
        result.push({
          provider: 'dweb',
          name: name
        });
      }
    }
    if (!domainProvider || domainProvider === 'ens') {
      const name = await this.ethereum.provider.lookupAddress(checksumAddress);
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
