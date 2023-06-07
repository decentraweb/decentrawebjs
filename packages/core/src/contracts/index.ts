import { ContractInterface, ethers } from 'ethers';
import { ContractConfig, ContractOptions, DwebContract, EthNetwork } from './interfaces';
import DecentraWebToken from './abi/DecentraWebToken.json';
import DWEBRegistry from './abi/ethereum/DWEBRegistry.json';
import DefaultReverseResolver from './abi/ethereum/DefaultReverseResolver.json';
import PublicResolver from './abi/ethereum/PublicResolver.json';
import ReverseRegistrar from './abi/ethereum/ReverseRegistrar.json';
import DWEBRegistry_polygon from './abi/polygon/DWEBRegistry.json';
import DefaultReverseResolver_polygon from './abi/polygon/DefaultReverseResolver.json';
import PublicResolver_polygon from './abi/polygon/PublicResolver.json';
import ReverseRegistrar_polygon from './abi/polygon/ReverseRegistrar.json';
import RootRegistrarController from './abi/RootRegistrarController.json';


const CONTRACT_ADDRESSES: Record<EthNetwork, ContractConfig> = {
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
  polygon: {
    DecentraWebToken: '',
    DWEBRegistry: '',
    DefaultReverseResolver: '',
    PublicResolver: '',
    ReverseRegistrar: '',
    RootRegistrarController: ''
  },
  mumbai: {
    DecentraWebToken: '',
    DWEBRegistry: '0x7aB6409511bb3b530d18705f401588Ac5CD76E96',
    DefaultReverseResolver: '0x55122e57540624f993E58DaB17d4c78252825841',
    PublicResolver: '0x096b7e364A6BDA0EF747a4d08ffe6534818EbB94',
    ReverseRegistrar: '0x3147754Fe7eBC052a46FD73683e338467B0C4160',
    RootRegistrarController: ''
  }
};

const ABI: Record<DwebContract, ContractInterface> = {
  DecentraWebToken,
  DWEBRegistry,
  DefaultReverseResolver,
  PublicResolver,
  ReverseRegistrar,
  RootRegistrarController
};

const POLYGON_ABI: Record<DwebContract, ContractInterface> = {
  DecentraWebToken: '',
  DWEBRegistry: DWEBRegistry_polygon,
  DefaultReverseResolver: DefaultReverseResolver_polygon,
  PublicResolver: PublicResolver_polygon,
  ReverseRegistrar: ReverseRegistrar_polygon,
  RootRegistrarController: ''
};

export function getContractConfig(network: EthNetwork): ContractConfig {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  return CONTRACT_ADDRESSES[network];
}

export function getContract({ address, name, provider, network }: ContractOptions) {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  if (network === 'polygon' || network === 'mumbai') {
    return new ethers.Contract(address, POLYGON_ABI[name], provider);
  } else {
    return new ethers.Contract(address, ABI[name], provider);
  }
}
