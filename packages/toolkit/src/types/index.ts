import { Network } from '@decentraweb/core';
import { providers } from 'ethers';

export type ToolkitConfig = {
  network: Network;
  provider: providers.BaseProvider;
  dnsServer?: string;
};

export type DomainProvider = 'dweb' | 'ens' | 'icann';
