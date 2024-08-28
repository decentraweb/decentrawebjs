import { EthereumNetwork, Network, PolygonNetwork } from '@decentraweb/core';
import { AbstractProvider } from 'ethers';

export type ApiProvider = 'etherscan' | 'infura' | 'alchemy' | 'cloudflare' | 'pocket' | 'ankr';

export interface ApiProviderConfig {
  /** Name of ethereum network provider */
  apiProvider: ApiProvider;
  /** API key for provider */
  apiKey: string;
  /** Use production network (mainnet and matic) or testnet (sepolia and maticmum) */
  production: boolean;
  /** DNS server to use for ICANN domains */
  dnsServer?: string;
}

export function isApiProviderConfig(config: any): config is ApiProviderConfig {
  return config && config.apiProvider && config.apiKey;
}

export interface ProviderSet {
  ethereum: {
    /** Ethereum network name */
    network: EthereumNetwork;
    /** Ethers.js provider instance */
    provider: AbstractProvider;
  };
  polygon: {
    /** Polygon network name */
    network: PolygonNetwork;
    /** Ethers.js provider instance */
    provider: AbstractProvider;
  };
}

export interface NamekitConfig extends ProviderSet {
  dnsServer?: string;
}

export interface ENSConfig {
  network: EthereumNetwork;
  provider: AbstractProvider;
}

export interface DwebConfig {
  network: Network;
  provider: AbstractProvider;
}

export type DomainProvider = 'dweb' | 'ens' | 'icann';
