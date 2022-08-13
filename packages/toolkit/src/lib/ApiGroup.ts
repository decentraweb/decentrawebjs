import { providers } from 'ethers';
import { DWEBRegistry, EthNetwork } from '@decentraweb/core';
import { ToolkitConfig } from '../types';

export abstract class ApiGroup {
  readonly network: EthNetwork;
  readonly provider: providers.BaseProvider;
  protected dweb: DWEBRegistry;

  constructor(options: ToolkitConfig) {
    const { network, provider } = options;
    this.provider = provider;
    this.network = network;
    this.dweb = new DWEBRegistry(options);
  }
}

export default ApiGroup;
