import { EthNetwork } from '@decentraweb/core';
import { providers } from 'ethers';

export type ToolkitConfig = {
  network: EthNetwork;
  provider: providers.BaseProvider;
};

export type DomainProvider = 'dweb' | 'ens' | 'icann';
