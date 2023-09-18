import { EthereumAddress } from './EthereumAddress';
import { ToolkitConfig } from './types';
import ICANNDomain from './domain/ICANNDomain';
import ENSDomain from './domain/ENSDomain';
import DWEBDomain from './domain/DWEBDomain';
import getDomainProvider from './lib/getDomainProvider';

export class DwebToolkit {
  readonly address: EthereumAddress;
  readonly config: ToolkitConfig;

  constructor(config: ToolkitConfig) {
    this.config = config;
    this.address = new EthereumAddress(config);
  }

  async domain(name: string) {
    const provider = await getDomainProvider(name);
    let domain;
    switch (provider) {
      case 'dweb':
        domain = new DWEBDomain(name, {
          network: this.config.network,
          provider: this.config.provider
        });
        break;
      case 'ens':
        domain = new ENSDomain(name, {
          network: this.config.network,
          provider: this.config.provider
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

export default DwebToolkit;
