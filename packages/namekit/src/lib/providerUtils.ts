import { EthereumNetwork, PolygonNetwork } from '@decentraweb/core';
import { providers } from 'ethers';
import { ApiProviderConfig, ProviderSet } from '../types';

export async function detectEthNetwork(provider: providers.BaseProvider): Promise<EthereumNetwork> {
  const network = await provider.getNetwork();
  switch (network.chainId) {
    case 1:
      return 'mainnet';
    case 5:
      return 'goerli';
    default:
      throw new Error(`Unsupported network: ${network.name}`);
  }
}

export async function detectMaticNetwork(
  provider: providers.BaseProvider
): Promise<PolygonNetwork> {
  const network = await provider.getNetwork();
  switch (network.chainId) {
    case 137:
      return 'matic';
    case 80001:
      return 'maticmum';
    default:
      throw new Error(`Unsupported network: ${network.name}`);
  }
}

export function getProviders(config: ApiProviderConfig): ProviderSet {
  const ethereumNetwork = config.production ? 'mainnet' : 'goerli';
  const polygonNetwork = config.production ? 'matic' : 'maticmum';
  let ProviderClass;
  switch (config.apiProvider) {
    case 'etherscan':
      ProviderClass = providers.EtherscanProvider;
      break;
    case 'alchemy':
      ProviderClass = providers.AlchemyProvider;
      break;
    case 'infura':
      ProviderClass = providers.InfuraProvider;
      break;
    case 'cloudflare':
      ProviderClass = providers.CloudflareProvider;
      break;
    case 'pocket':
      ProviderClass = providers.PocketProvider;
      break;
    case 'ankr':
      ProviderClass = providers.AnkrProvider;
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
