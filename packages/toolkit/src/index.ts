import ApiGroup, { ToolkitConfig } from './lib/ApiGroup';
import { EthereumAddress } from './EthereumAddress';

export { ToolkitConfig };

export class DwebToolkit extends ApiGroup {
  readonly address: EthereumAddress;

  constructor(config: ToolkitConfig) {
    super(config);
    this.address = new EthereumAddress(config);
  }
}

export default DwebToolkit;
