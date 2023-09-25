import { ethers, providers } from 'ethers';

export type EthereumNetwork = 'mainnet' | 'goerli';

export type PolygonNetwork = 'matic' | 'maticmum';

export type Network = EthereumNetwork | PolygonNetwork;

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
  /** Ethereum/Polygon network */
  network: Network;
  /** Contract name */
  name: DwebContract;
  /** Ethereum provider */
  provider: ethers.Signer | providers.Provider;
  /** Contract address. Used to override default address */
  address?: string;
};

/**
 * Configuration for the Decentraweb contract wrappers
 * @property network - Ethereum network
 * @property provider - Ethers.js Ethereum provider
 * @property [signer] - Ethers.js Ethereum signer for writing data to the blockchain
 * @property [contracts] - Addresses of the Decentraweb contracts. Can be used to override the defaults.
 */
export type DwebConfig = {
  network: Network;
  provider: providers.BaseProvider;
  signer?: ethers.Signer;
  contracts?: ContractConfig;
};
