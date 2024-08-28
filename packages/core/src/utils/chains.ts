import { ChainId, Network } from '../types/common';
import { ethers, JsonRpcProvider, Provider } from 'ethers';

const CHAIN_IDS: Record<Network, ChainId> = {
  mainnet: 1,
  sepolia: 11155111,
  matic: 137,
  'matic-amoy': 80002
};

const NETWORKS: Record<ChainId, Network> = Object.entries(CHAIN_IDS).reduce(
  (acc, [network, chainId]) => {
    acc[chainId] = network as Network;
    return acc;
  },
  {} as Record<ChainId, Network>
);

const DEFAULT_RPC_URLS: Partial<Record<Network, string>> = {
  'matic-amoy': 'https://rpc-amoy.polygon.technology' // Ethers.js doesn't support matic-amoy by default
};

export function getChainId(network: Network): ChainId {
  if (!CHAIN_IDS[network]) {
    throw new Error('Unknown network name');
  }
  return CHAIN_IDS[network];
}

export function getNetwork(chainId: ChainId): Network {
  if (!NETWORKS[chainId]) {
    throw new Error('Unknown chain ID');
  }
  return NETWORKS[chainId];
}

export function isMaticChain(network: Network): boolean {
  return network === 'matic' || network === 'matic-amoy';
}

export function getDefaultProvider(network: Network): Provider {
  const rpcUrl = DEFAULT_RPC_URLS[network];
  if (rpcUrl) {
    return new JsonRpcProvider(rpcUrl, getChainId(network));
  }
  return ethers.getDefaultProvider(network);
}
