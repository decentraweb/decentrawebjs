import { ContractInterface, ethers, providers } from 'ethers';
//Ethereum ABI
import DecentraWebToken from './abi/DecentraWebToken.json' assert { type: 'json' };
import DWEBRegistry from './abi/ethereum/DWEBRegistry.json' assert { type: 'json' };
import DefaultReverseResolver from './abi/ethereum/DefaultReverseResolver.json' assert { type: 'json' };
import PublicResolver from './abi/ethereum/PublicResolver.json' assert { type: 'json' };
import ReverseRegistrar from './abi/ethereum/ReverseRegistrar.json' assert { type: 'json' };
import RootRegistrarController from './abi/ethereum/RootRegistrarController.json' assert { type: 'json' };
//Polygon ABI
import WrappedEthToken from './abi/WrappedEthToken.json' assert { type: 'json' };
import DWEBRegistryPolygon from './abi/polygon/DWEBRegistry.json' assert { type: 'json' };
import DefaultReverseResolverPolygon from './abi/polygon/DefaultReverseResolver.json' assert { type: 'json' };
import PublicResolverPolygon from './abi/polygon/PublicResolver.json' assert { type: 'json' };
import ReverseRegistrarPolygon from './abi/polygon/ReverseRegistrar.json' assert { type: 'json' };
import RootRegistrarControllerPolygon from './abi/polygon/RootRegistrarController.json' assert { type: 'json' };
import {
  ContractConfig,
  ContractOptions,
  DwebContract,
  Network,
  PolygonNetwork
} from '../types/common.js';

/**
 * Contract addresses for different Ethereum/Polygon networks
 * @source Current contract addresses are following:
 * ```js
 * const CONTRACT_ADDRESSES = {
 *   mainnet: {
 *     DecentraWebToken: '0xE7f58A92476056627f9FdB92286778aBd83b285F',
 *     DWEBRegistry: '0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A',
 *     DefaultReverseResolver: '0x7d770Cfe9608Ff3AA3F5A34bdCd27c3870a370Da',
 *     PublicResolver: '0xf157D3559DF1F8c69cb757A1A2cdF8736618E083',
 *     ReverseRegistrar: '0x3D8f878584199e47a2d40A1E269042E10aa50754',
 *     RootRegistrarController: '0xcCbCa4F9651Ef122D58d7EC5acCa27D806840209'
 *   },
 *   goerli: {
 *     DecentraWebToken: '0x174db1922A6De366E253084ce7912463E57C11ae',
 *     DWEBRegistry: '0x33564B7b69E385615Db1e26A0fF917F3B2992c87',
 *     DefaultReverseResolver: '0xfF2e022F4D45ef8D4c7eA73f4dE2D63C8d437F2e',
 *     PublicResolver: '0xfE3146317183cBdebDeE12c3584141Fb15a80668',
 *     ReverseRegistrar: '0xA6E4607755F1cbF45E6f9e0840d3Be3075F3d729',
 *     RootRegistrarController: '0x94281bc70d6D62cc1DEb81A44b62cc7Fa22B10be'
 *   },
 *   matic: {
 *     DecentraWebToken: '0x8839e639F210B80ffea73AedF51baed8DAc04499',
 *     DWEBRegistry: '0x9f3eadf2360Dc4432a003699398169A2c7C10211',
 *     DefaultReverseResolver: '0xeEc93022ec031d6AD2E35AA36edFE80d73F8808a',
 *     PublicResolver: '0xEF2a00dc4ecA8174Bcf59dd8e124ba8f99307FF8',
 *     ReverseRegistrar: '0x662b0b6253e44F56DF387aCabd86A69D1e2A8cA9',
 *     RootRegistrarController: '0x38CcdB2660C63374e475090aAbE4F8339Cf4232E'
 *   },
 *   maticmum: {
 *     DecentraWebToken: '0x2Bdd2aC5329579FE1E4110b88Cbb9c43445D13ac',
 *     DWEBRegistry: '0x7237E2188Ce96925E28654AF34Fa6b0937Ef4575',
 *     DefaultReverseResolver: '0x73a29347BFECa3fDDD5354B75E02A10B2E718407',
 *     PublicResolver: '0xfCea3D3353CFD21861D1dC1caE8aD39Db017ee73',
 *     ReverseRegistrar: '0x36E8A0f10c5C2d1ccE81974133cAE4F583daE3e9',
 *     RootRegistrarController: '0x957B1254c0944531C2fcE5a4d2C80Bf239574f1f'
 *   }
 * };
 * ```
 */
export const CONTRACT_ADDRESSES: Record<Network, ContractConfig> = {
  mainnet: {
    DecentraWebToken: '0xE7f58A92476056627f9FdB92286778aBd83b285F',
    DWEBRegistry: '0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A',
    DefaultReverseResolver: '0x7d770Cfe9608Ff3AA3F5A34bdCd27c3870a370Da',
    PublicResolver: '0xf157D3559DF1F8c69cb757A1A2cdF8736618E083',
    ReverseRegistrar: '0x3D8f878584199e47a2d40A1E269042E10aa50754',
    RootRegistrarController: '0xcCbCa4F9651Ef122D58d7EC5acCa27D806840209'
  },
  goerli: {
    DecentraWebToken: '0x174db1922A6De366E253084ce7912463E57C11ae',
    DWEBRegistry: '0x33564B7b69E385615Db1e26A0fF917F3B2992c87',
    DefaultReverseResolver: '0xfF2e022F4D45ef8D4c7eA73f4dE2D63C8d437F2e',
    PublicResolver: '0xfE3146317183cBdebDeE12c3584141Fb15a80668',
    ReverseRegistrar: '0xA6E4607755F1cbF45E6f9e0840d3Be3075F3d729',
    RootRegistrarController: '0x94281bc70d6D62cc1DEb81A44b62cc7Fa22B10be'
  },
  matic: {
    DecentraWebToken: '0x8839e639F210B80ffea73AedF51baed8DAc04499',
    DWEBRegistry: '0x9f3eadf2360Dc4432a003699398169A2c7C10211',
    DefaultReverseResolver: '0xeEc93022ec031d6AD2E35AA36edFE80d73F8808a',
    PublicResolver: '0xEF2a00dc4ecA8174Bcf59dd8e124ba8f99307FF8',
    ReverseRegistrar: '0x662b0b6253e44F56DF387aCabd86A69D1e2A8cA9',
    RootRegistrarController: '0x38CcdB2660C63374e475090aAbE4F8339Cf4232E'
  },
  maticmum: {
    DecentraWebToken: '0x2Bdd2aC5329579FE1E4110b88Cbb9c43445D13ac',
    DWEBRegistry: '0x7237E2188Ce96925E28654AF34Fa6b0937Ef4575',
    DefaultReverseResolver: '0x73a29347BFECa3fDDD5354B75E02A10B2E718407',
    PublicResolver: '0xfCea3D3353CFD21861D1dC1caE8aD39Db017ee73',
    ReverseRegistrar: '0x36E8A0f10c5C2d1ccE81974133cAE4F583daE3e9',
    RootRegistrarController: '0x957B1254c0944531C2fcE5a4d2C80Bf239574f1f'
  }
};

/**
 * Wrapped ETH contract addresses for different Polygon networks
 */
const WETH_ADDRESSES: Record<PolygonNetwork, string> = {
  matic: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  maticmum: '0x602e78C34Da5208090B5A1d49db07F17737E5b11'
};

/**
 * Contract ABIs for Ethereum network
 */
export const ABI: Record<DwebContract, ContractInterface> = {
  DecentraWebToken,
  DWEBRegistry,
  DefaultReverseResolver,
  PublicResolver,
  ReverseRegistrar,
  RootRegistrarController
};

/**
 * Contract ABIs for Polygon network. Some contracts are different from Ethereum.
 */
export const POLYGON_ABI: Record<DwebContract, ContractInterface> = {
  DecentraWebToken,
  DWEBRegistry: DWEBRegistryPolygon,
  DefaultReverseResolver: DefaultReverseResolverPolygon,
  PublicResolver: PublicResolverPolygon,
  ReverseRegistrar: ReverseRegistrarPolygon,
  RootRegistrarController: RootRegistrarControllerPolygon
};

/**
 * Get contract addresses for given Polygon/Ethereum network
 * @param network
 */
export function getContractConfig(network: Network): ContractConfig {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  return CONTRACT_ADDRESSES[network];
}

/**
 * Get contract instance
 * @example const contract = getContract({ name: 'DecentraWebToken', network: 'mainnet', provider });
 */
export function getContract({
  address,
  name,
  provider,
  network
}: ContractOptions): ethers.Contract {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  const contractAddress = address || CONTRACT_ADDRESSES[network][name];
  if (network === 'matic' || network === 'maticmum') {
    return new ethers.Contract(contractAddress, POLYGON_ABI[name], provider);
  } else {
    return new ethers.Contract(contractAddress, ABI[name], provider);
  }
}

/**
 * Get Decentraweb token contract address
 * @param network - Ethereum/Polygon network name
 */
export function getDwebAddress(network: Network): string {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  return CONTRACT_ADDRESSES[network].DecentraWebToken;
}

/**
 * Get Wrapped Ethereum token address for Polygon network
 * @param network
 */
export function getWethAddress(network: PolygonNetwork): string {
  if (!WETH_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  return WETH_ADDRESSES[network];
}

/**
 * Get Wrapped Ethereum token contract instance for Polygon network
 * @param network
 * @param provider
 */
export function getWethContract(
  network: PolygonNetwork,
  provider: ethers.Signer | providers.Provider
): ethers.Contract {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  return new ethers.Contract(WETH_ADDRESSES[network], WrappedEthToken, provider);
}
