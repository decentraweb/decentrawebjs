import {ethers, providers} from "ethers";
import registryContract from "../contracts/DWEBRegistry.json";
import publicResolverContract from "../contracts/PublicResolver.json";


export const EthNetworkIds = {
  'rinkeby': 4,
}

export type EthNetwork = 'rinkeby'

export function getRegistryAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0x99FeB3D2FEf014BFf5CeDff9f0EB4Cf708397BBA'
  }
  throw new Error('Unknown network ID')
}
export function getResolverAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0xdDf4Cd47f6AC2be831833b1d401143bce6762EDA'
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
