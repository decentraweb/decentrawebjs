import { EthereumAddress } from './EthereumAddress';
import { ApiProviderConfig, isApiProviderConfig, NamekitConfig } from './types';
import ICANNDomain from './domain/ICANNDomain';
import ENSDomain from './domain/ENSDomain';
import DWEBDomain from './domain/DWEBDomain';
import getDomainProvider from './lib/getDomainProvider';
import { getProviders } from './lib/providerUtils';
import { DWEBRegistry } from '@decentraweb/core';

/**
 * Helper class to resolve data for Decentraweb, ENS and classic domains.
 *
 */
export class DwebNamekit {
  readonly address: EthereumAddress;
  readonly config: NamekitConfig;
  readonly ethRegistry: DWEBRegistry;
  readonly polygonRegistry: DWEBRegistry;

  constructor(config: NamekitConfig | ApiProviderConfig) {
    if (isApiProviderConfig(config)) {
      this.config = {
        ...getProviders(config),
        dnsServer: config.dnsServer
      };
    } else {
      this.config = config;
    }
    this.address = new EthereumAddress(this.config);
    this.ethRegistry = new DWEBRegistry(this.config.ethereum);
    this.polygonRegistry = new DWEBRegistry(this.config.polygon);
  }

  async domain(name: string) {
    const provider = await getDomainProvider(name);
    let domain;
    switch (provider) {
      case 'dweb': {
        const isNameOnEthereum = await this.ethRegistry.nameExists(name);
        domain = new DWEBDomain(
          name,
          isNameOnEthereum ? this.config.ethereum : this.config.polygon
        );
        break;
      }
      case 'ens':
        domain = new ENSDomain(name, {
          network: this.config.ethereum.network,
          provider: this.config.ethereum.provider
        });
        break;
      case 'icann':
        domain = new ICANNDomain(name, this.config.dnsServer);
        break;
      default:
        return null;
    }
    return (await domain.exists()) ? domain : null;
  }

  getDomainProvider(name: string) {
    return getDomainProvider(name);
  }
}

export default DwebNamekit;
