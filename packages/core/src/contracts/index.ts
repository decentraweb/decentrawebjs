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
    DWEBRegistry: '0x3ADcefb6835BD806bEaD4295aB696c9411e55FDE',
    DefaultReverseResolver: '0x7082e7180AF92f4640557AfA17205E11a1BF3619',
    PublicResolver: '0xFf2B6c01b3610c1eb2FFDf8648bF66d319B36180',
    ReverseRegistrar: '0xC1C76435EC3b1d66A1B83dA50781138126AAfeed'
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
