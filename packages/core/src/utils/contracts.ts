import {ethers, providers} from "ethers";
import registryContract from "../contracts/DWEBRegistry.json";
import publicResolverContract from "../contracts/PublicResolver.json";

export const EthNetworkIds = {
  'mainnet': 1,
  'rinkeby': 4
}

export type EthNetwork = 'mainnet'

export function getRegistryAddress(networkId: EthNetwork) {
  if (networkId === 'rinkeby') {
    return '0xFF01dD9876244b6D4835Deb8441f9605bFBdBfb3'
  }else if (networkId === 'mainnet') {
    return '0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A'
  }
  throw new Error('Unknown network ID')
}
export function getResolverAddress(networkId: EthNetwork) {
  if (networkId === 'rinkeby') {
    return '0x4d8592961e2C68A0ce092D370EA2330B89091302'
  }else if (networkId === 'mainnet') {
    return '0xf157D3559DF1F8c69cb757A1A2cdF8736618E083'
  }

  throw new Error('Unknown network ID')
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

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DEFAULT_TTL = 600
