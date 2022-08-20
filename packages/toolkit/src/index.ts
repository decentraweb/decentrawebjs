import ApiGroup from './lib/ApiGroup';
import { EthereumAddress } from './EthereumAddress';
import getDomainProvider from './lib/getDomainProvider';
import DWEBDomain from './domain/DWEBDomain';
import { ToolkitConfig } from './types';
import ENSDomain from './domain/ENSDomain/index';

export * from './types/index';

export { ENSDomain, DWEBDomain };

export class DwebToolkit extends ApiGroup {
  readonly address: EthereumAddress;

  constructor(config: ToolkitConfig) {
    super(config);
    this.address = new EthereumAddress(config);
  }

  async domain(name: string) {
    const provider = await getDomainProvider(name);
    let domain;
    switch (provider) {
      case 'dweb':
        domain = new DWEBDomain(name, { network: this.network, provider: this.provider });
        break;
      case 'ens':
        domain = new ENSDomain(name, { network: this.network, provider: this.provider });
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
