import { EthereumNetwork, Network, PolygonNetwork } from '@decentraweb/core';
import { providers } from 'ethers';

type ApiProvider = 'etherscan' | 'infura' | 'alchemy' | 'cloudflare' | 'pocket' | 'ankr';

export interface ApiProviderConfig {
  apiProvider: ApiProvider;
  apiKey: string;
  production: boolean;
  dnsServer?: string;
}

export function isApiProviderConfig(config: any): config is ApiProviderConfig {
  return config && config.apiProvider && config.apiKey;
}

export interface ProviderSet {
  ethereum: {
    network: EthereumNetwork;
    provider: providers.BaseProvider;
  };
  polygon: {
    network: PolygonNetwork;
    provider: providers.BaseProvider;
  };
}

export interface ToolkitConfig extends ProviderSet {
  dnsServer?: string;
}

export interface ENSConfig {
  network: EthereumNetwork;
  provider: providers.BaseProvider;
}

export interface DwebConfig {
  network: Network;
  provider: providers.BaseProvider;
}

export type DomainProvider = 'dweb' | 'ens' | 'icann';
