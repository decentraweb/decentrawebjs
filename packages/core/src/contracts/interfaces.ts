import { ethers, providers } from 'ethers';

export type EthNetwork = 'mainnet' | 'goerli' | 'matic' | 'maticmum';

export type ChainId = 1 | 5 | 137 | 80001;

export type DwebContract =
  | 'DecentraWebToken'
  | 'DWEBRegistry'
  | 'DefaultReverseResolver'
  | 'PublicResolver'
  | 'ReverseRegistrar'
  | 'RootRegistrarController';

export type ContractConfig = Record<DwebContract, string>;

export type ContractOptions = {
  address: string;
  name: DwebContract;
  provider: ethers.Signer | providers.Provider;
  network: EthNetwork;
};
