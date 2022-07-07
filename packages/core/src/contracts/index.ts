import {ContractInterface, ethers} from "ethers";
import {ContractConfig, ContractOptions, DwebContract, EthNetwork} from "./interfaces";
import DWEBRegistry from './abi/DWEBRegistry.json';
import DefaultReverseResolver from './abi/DefaultReverseResolver.json';
import PublicResolver from './abi/PublicResolver.json';
import ReverseRegistrar from './abi/ReverseRegistrar.json';


const CONTRACT_ADDRESSES: Record<EthNetwork, ContractConfig> = {
  mainnet: {
    "DWEBRegistry": "0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A",
    "DefaultReverseResolver": "0x7d770Cfe9608Ff3AA3F5A34bdCd27c3870a370Da",
    "PublicResolver": "0xf157D3559DF1F8c69cb757A1A2cdF8736618E083",
    "ReverseRegistrar": "0x3D8f878584199e47a2d40A1E269042E10aa50754"
  },
  rinkeby: {
    "DWEBRegistry": "0x0B4692C0e3714Ef03e6dBb8B3Fd27B795f6BeE0D",
    "DefaultReverseResolver": "0x8cE51B72425735D050B165f69847Ed45C63067A8",
    "PublicResolver": "0xc06576144F22359b5c7EcC2623EB0e4E3CeE29Ae",
    "ReverseRegistrar": "0x1220a6c373a6Eb4882db753713e71659EA2348DD",
  }
}

const ABI: Record<DwebContract, ContractInterface> = {
  DWEBRegistry,
  DefaultReverseResolver,
  PublicResolver,
  ReverseRegistrar,
}


export function getContractConfig(network: EthNetwork): ContractConfig {
  if(!CONTRACT_ADDRESSES[network]){
    throw new Error('Unknown network name');
  }
  return CONTRACT_ADDRESSES[network];
}

export function getContract({address, name, provider}: ContractOptions){
  return new ethers.Contract(address, ABI[name], provider)
}
