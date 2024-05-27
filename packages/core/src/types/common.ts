import { ethers, providers } from 'ethers';

export type EthereumNetwork = 'mainnet' | 'sepolia';

export type PolygonNetwork = 'matic' | 'matic-amoy';

export type Network = EthereumNetwork | PolygonNetwork;

export type EthChainId = 1 | 11155111;

export type PolygonChainId = 137 | 80002;

export type ChainId = EthChainId | PolygonChainId;

export type DwebContract =
  | 'DWEBRegistryV2'
  | 'DefaultReverseResolver'
  | 'PublicResolver'
  | 'ReverseRegistrar'
  | 'RootRegistrarController'
  | 'RootRegistrarControllerSld';

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

export type NativeToken = 'ETH' | 'MATIC';

export type AltToken = 'DWEB' | 'WETH' | 'USDC' | 'USDT';

export type Token = NativeToken | AltToken;

export type AltTokenConfig = Record<AltToken, string | null>;
