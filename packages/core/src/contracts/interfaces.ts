import { ethers, providers } from 'ethers';

export type EthNetwork = 'mainnet' | 'goerli' | 'polygon' | 'mumbai';

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
