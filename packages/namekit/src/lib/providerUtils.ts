import { EthereumNetwork, PolygonNetwork } from '@decentraweb/core';
import {
  AbstractProvider,
  AlchemyProvider,
  AnkrProvider,
  CloudflareProvider,
  EtherscanProvider,
  InfuraProvider,
  PocketProvider
} from 'ethers';
import { ApiProviderConfig, ProviderSet } from '../types';

export async function detectEthNetwork(provider: AbstractProvider): Promise<EthereumNetwork> {
  const network = await provider.getNetwork();
  switch (Number(network.chainId)) {
    case 1:
      return 'mainnet';
    case 11155111:
      return 'sepolia';
    default:
      throw new Error(`Unsupported network: ${network.name}`);
  }
}

export async function detectMaticNetwork(provider: AbstractProvider): Promise<PolygonNetwork> {
  const network = await provider.getNetwork();
  switch (Number(network.chainId)) {
    case 137:
      return 'matic';
    case 80001:
      return 'matic-amoy';
    default:
      throw new Error(`Unsupported network: ${network.name}`);
  }
}

export function getProviders(config: ApiProviderConfig): ProviderSet {
  const ethereumNetwork: EthereumNetwork = config.production ? 'mainnet' : 'sepolia';
  const polygonNetwork: PolygonNetwork = config.production ? 'matic' : 'matic-amoy';
  let ProviderClass;
  switch (config.apiProvider) {
    case 'etherscan':
      ProviderClass = EtherscanProvider;
      break;
    case 'alchemy':
      ProviderClass = AlchemyProvider;
      break;
    case 'infura':
      ProviderClass = InfuraProvider;
      break;
    case 'cloudflare':
      ProviderClass = CloudflareProvider;
      break;
    case 'pocket':
      ProviderClass = PocketProvider;
      break;
    case 'ankr':
      ProviderClass = AnkrProvider;
      break;
    default:
      throw new Error(`Unsupported provider: ${config.apiProvider}`);
  }
  return {
    ethereum: {
      network: ethereumNetwork,
      provider: new ProviderClass(ethereumNetwork, config.apiKey)
    },
    polygon: {
      network: polygonNetwork,
      provider: new ProviderClass(polygonNetwork, config.apiKey)
    }
  };
}
