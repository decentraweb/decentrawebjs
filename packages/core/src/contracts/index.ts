import { ContractInterface, ethers } from 'ethers';
//Ethereum ABI
import DWEBRegistryV2 from './abi/ethereum/DWEBRegistryV2.json';
import DefaultReverseResolver from './abi/ethereum/DefaultReverseResolver.json';
import PublicResolver from './abi/ethereum/PublicResolver.json';
import ReverseRegistrar from './abi/ethereum/ReverseRegistrar.json';
import RootRegistrarController from './abi/ethereum/RootRegistrarController.json';
import RootRegistrarControllerSld from './abi/ethereum/RootRegistrarControllerSld.json';
//Polygon ABI
import DWEBRegistryV2Polygon from './abi/polygon/DWEBRegistryV2.json';
import DefaultReverseResolverPolygon from './abi/polygon/DefaultReverseResolver.json';
import PublicResolverPolygon from './abi/polygon/PublicResolver.json';
import ReverseRegistrarPolygon from './abi/polygon/ReverseRegistrar.json';
import RootRegistrarControllerPolygon from './abi/polygon/RootRegistrarController.json';
import RootRegistrarControllerSldPolygon from './abi/polygon/RootRegistrarControllerSld.json';
import { ContractConfig, ContractOptions, DwebContract, Network } from '../types/common';
import { isMaticChain } from '../utils/chains';

/**
 * Contract addresses for different Ethereum/Polygon networks
 * @source Current contract addresses are following:
 * ```js
 * const CONTRACT_ADDRESSES = {
 *   mainnet: {
 *     DWEBRegistryV2: '',
 *     DefaultReverseResolver: '',
 *     PublicResolver: '',
 *     ReverseRegistrar: '',
 *     RootRegistrarController: '',
 *     RootRegistrarControllerSld: ''
 *   },
 *   sepolia: {
 *     DWEBRegistryV2: '0x650b85399f263BdcD0A374164C7520Df35c28Bf4',
 *     DefaultReverseResolver: '0x7DAFad7B1560c2230572D0962f1aBb7BCE0c6185',
 *     PublicResolver: '0x57AdD3DF411256d53F983D0e9685b60944F657A5',
 *     ReverseRegistrar: '0x7677978DF0BfF0eccC5BCcbD3Cb4Dd82C9095109',
 *     RootRegistrarController: '0xEc7F84DbE2Acc56f477D1ce5943Fad6619850f4C',
 *     RootRegistrarControllerSld: '0xdb33a899e4015164807d76a10e7b87EcB81D1804'
 *   },
 *   matic: {
 *     DWEBRegistryV2: '',
 *     DefaultReverseResolver: '',
 *     PublicResolver: '',
 *     ReverseRegistrar: '',
 *     RootRegistrarController: '',
 *     RootRegistrarControllerSld: ''
 *   },
 *   'matic-amoy': {
 *     DWEBRegistryV2: '0xfB300317c70Da9ED624E4077E94A85999E2B9f81',
 *     DefaultReverseResolver: '0xb45F25E8BeA154414d53c519a2762a724f6e6E6c',
 *     PublicResolver: '0xfFB7E813586Ce5119AF0c74b5fC77F905783B56E',
 *     ReverseRegistrar: '0x786e3046b86A242b0C291bed255A698e11c09451',
 *     RootRegistrarController: '0x4E2DD4DF7B8929261c8291B8de21B4548AeDb07c',
 *     RootRegistrarControllerSld: '0x2706935eC64bDBf9947d7ACD8A3d89D7A0628d1e'
 *   }
 * };
 * ```
 */
export const CONTRACT_ADDRESSES: Record<Network, ContractConfig> = {
  mainnet: {
    DWEBRegistryV2: '',
    DefaultReverseResolver: '',
    PublicResolver: '',
    ReverseRegistrar: '',
    RootRegistrarController: '',
    RootRegistrarControllerSld: ''
  },
  sepolia: {
    DWEBRegistryV2: '0x650b85399f263BdcD0A374164C7520Df35c28Bf4',
    DefaultReverseResolver: '0x7DAFad7B1560c2230572D0962f1aBb7BCE0c6185',
    PublicResolver: '0x57AdD3DF411256d53F983D0e9685b60944F657A5',
    ReverseRegistrar: '0x7677978DF0BfF0eccC5BCcbD3Cb4Dd82C9095109',
    RootRegistrarController: '0xEc7F84DbE2Acc56f477D1ce5943Fad6619850f4C',
    RootRegistrarControllerSld: '0xdb33a899e4015164807d76a10e7b87EcB81D1804'
  },
  matic: {
    DWEBRegistryV2: '',
    DefaultReverseResolver: '',
    PublicResolver: '',
    ReverseRegistrar: '',
    RootRegistrarController: '',
    RootRegistrarControllerSld: ''
  },
  'matic-amoy': {
    DWEBRegistryV2: '0xfB300317c70Da9ED624E4077E94A85999E2B9f81',
    DefaultReverseResolver: '0xb45F25E8BeA154414d53c519a2762a724f6e6E6c',
    PublicResolver: '0xfFB7E813586Ce5119AF0c74b5fC77F905783B56E',
    ReverseRegistrar: '0x786e3046b86A242b0C291bed255A698e11c09451',
    RootRegistrarController: '0x4E2DD4DF7B8929261c8291B8de21B4548AeDb07c',
    RootRegistrarControllerSld: '0x2706935eC64bDBf9947d7ACD8A3d89D7A0628d1e'
  }
};

/**
 * Contract ABIs for Ethereum network
 */
export const ABI: Record<DwebContract, ContractInterface> = {
  DWEBRegistryV2,
  DefaultReverseResolver,
  PublicResolver,
  ReverseRegistrar,
  RootRegistrarController,
  RootRegistrarControllerSld
};

/**
 * Contract ABIs for Polygon network. Some contracts are different from Ethereum.
 */
export const POLYGON_ABI: Record<DwebContract, ContractInterface> = {
  DWEBRegistryV2: DWEBRegistryV2Polygon,
  DefaultReverseResolver: DefaultReverseResolverPolygon,
  PublicResolver: PublicResolverPolygon,
  ReverseRegistrar: ReverseRegistrarPolygon,
  RootRegistrarController: RootRegistrarControllerPolygon,
  RootRegistrarControllerSld: RootRegistrarControllerSldPolygon
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
  if (isMaticChain(network)) {
    return new ethers.Contract(contractAddress, POLYGON_ABI[name], provider);
  } else {
    return new ethers.Contract(contractAddress, ABI[name], provider);
  }
}
