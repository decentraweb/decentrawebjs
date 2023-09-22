import { ChainId, Network } from '../types/common.cjs';

export function getChainId(network: Network): ChainId {
  switch (network) {
    case 'mainnet':
      return 1;
    case 'goerli':
      return 5;
    case 'matic':
      return 137;
    case 'maticmum':
      return 80001;
    default:
      throw new Error('Unknown network name');
  }
}
