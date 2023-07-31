import { ethers, providers } from 'ethers';

export type EthereumNetwork = 'mainnet' | 'goerli';

export type PolygonNetwork = 'matic' | 'maticmum';

export type EthNetwork = EthereumNetwork | PolygonNetwork;

export type EthChainId = 1 | 5;

export type PolygonChainId = 137 | 80001;

export type ChainId = EthChainId | PolygonChainId;

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
