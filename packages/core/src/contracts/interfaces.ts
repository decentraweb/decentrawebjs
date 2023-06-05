import { ethers, providers } from 'ethers';

export type EthNetwork = 'mainnet' | 'goerli' | 'polygon' | 'mumbai';

export type DwebContract =
  | 'DWEBRegistry'
  | 'DefaultReverseResolver'
  | 'PublicResolver'
  | 'ReverseRegistrar';

export type ContractConfig = Record<DwebContract, string>;

export type ContractOptions = {
  address: string;
  name: DwebContract;
  provider: ethers.Signer | providers.Provider;
  network: EthNetwork;
};
