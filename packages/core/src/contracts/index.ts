import { ContractInterface, ethers } from 'ethers';
import { ContractConfig, ContractOptions, DwebContract, EthNetwork } from './interfaces';
import DWEBRegistry from './abi/DWEBRegistry.json';
import DefaultReverseResolver from './abi/DefaultReverseResolver.json';
import PublicResolver from './abi/PublicResolver.json';
import ReverseRegistrar from './abi/ReverseRegistrar.json';

const CONTRACT_ADDRESSES: Record<EthNetwork, ContractConfig> = {
  mainnet: {
    DWEBRegistry: '0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A',
    DefaultReverseResolver: '0x7d770Cfe9608Ff3AA3F5A34bdCd27c3870a370Da',
    PublicResolver: '0xf157D3559DF1F8c69cb757A1A2cdF8736618E083',
    ReverseRegistrar: '0x3D8f878584199e47a2d40A1E269042E10aa50754'
  },
  goerli: {
    DWEBRegistry: '0x33564B7b69E385615Db1e26A0fF917F3B2992c87',
    DefaultReverseResolver: '0xfF2e022F4D45ef8D4c7eA73f4dE2D63C8d437F2e',
    PublicResolver: '0xfE3146317183cBdebDeE12c3584141Fb15a80668',
    ReverseRegistrar: '0xA6E4607755F1cbF45E6f9e0840d3Be3075F3d729'
  }
};

const ABI: Record<DwebContract, ContractInterface> = {
  DWEBRegistry,
  DefaultReverseResolver,
  PublicResolver,
  ReverseRegistrar
};

export function getContractConfig(network: EthNetwork): ContractConfig {
  if (!CONTRACT_ADDRESSES[network]) {
    throw new Error('Unknown network name');
  }
  return CONTRACT_ADDRESSES[network];
}

export function getContract({ address, name, provider }: ContractOptions) {
  return new ethers.Contract(address, ABI[name], provider);
}
