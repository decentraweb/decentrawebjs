import {ethers, providers} from "ethers";
import registryContract from "../contracts/DWEBRegistry.json";
import publicResolverContract from "../contracts/PublicResolver.json";
import reverseRegistrarContract from "../contracts/ReverseRegistrar.json";


export declare type EthNetwork = 'mainnet' | 'rinkeby';

export const EthNetworkIds: Record<EthNetwork, number> = {
  'mainnet': 1,
  'rinkeby': 4
}

export function getRegistryAddress(networkId: EthNetwork) {
  switch(EthNetworkIds[networkId]) {
    case 1:
      return '0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A'
    case 4:
      return '0x0B4692C0e3714Ef03e6dBb8B3Fd27B795f6BeE0D'
    default:
      throw new Error('Unknown network ID')
  }
}

export function getReverseRegistrarAddress(networkId: EthNetwork) {
  switch(EthNetworkIds[networkId]) {
    case 1:
      return '0x3D8f878584199e47a2d40A1E269042E10aa50754'
    case 4:
      return '0x1220a6c373a6Eb4882db753713e71659EA2348DD'
    default:
      throw new Error('Unknown network ID')
  }
}

export function getResolverAddress(networkId: EthNetwork) {
  switch(EthNetworkIds[networkId]) {
    case 1:
      return '0xf157D3559DF1F8c69cb757A1A2cdF8736618E083'
    case 4:
      return '0xc06576144F22359b5c7EcC2623EB0e4E3CeE29Ae'
    default:
      throw new Error('Unknown network ID')
  }
}

export type ContractOptions = {
  address: string,
  provider: ethers.Signer | providers.Provider
}

export function getResolverContract({address, provider}: ContractOptions) {
  return new ethers.Contract(address, publicResolverContract, provider)
}

export function getRegistryContract({address, provider}: ContractOptions) {
  return new ethers.Contract(address, registryContract, provider)
}

export function getReverseRegistrarContract({ address, provider }: ContractOptions) {
  return new ethers.Contract(address, reverseRegistrarContract, provider)
}

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DEFAULT_TTL = 600
