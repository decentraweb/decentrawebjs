import ApiGroup from './lib/ApiGroup';
import { DWEBRegistry } from '@decentraweb/core';
import {DomainProvider, getNameProvider} from './lib/getNameProvider';

interface ResolutionResult {
  provider: DomainProvider;
  name: string;
}

export class EthereumAddress extends ApiGroup {
  /**
   * Find ethereum address by domain name
   * @param name
   */
  async lookup(name: string): Promise<string | null> {
    const domainProvider = await getNameProvider(name);
    switch (domainProvider) {
      case 'dweb': {
        const dwebName = this.dweb.name('test');
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
  async resolve(address: string, domainProvider?: DomainProvider): Promise<ResolutionResult[] | string | null> {
    const result: ResolutionResult[] = [];
    if (!domainProvider || domainProvider === 'dweb') {
      const name = await this.dweb.getReverseRecord(address);
      if (name) {
        result.push({
          provider: 'dweb',
          name: name
        });
      }
    }
    if (!domainProvider || domainProvider === 'ens') {
      const name = await this.provider.lookupAddress(address);
      if (name) {
        result.push({
          provider: 'ens',
          name: name
        });
      }
    }
    return domainProvider ? (result[0]?.name || null) : result
  }
}
