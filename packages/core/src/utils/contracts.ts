import {ethers, providers} from "ethers";
import registryContract from "../contracts/DWEBRegistry.json";
import publicResolverContract from "../contracts/PublicResolver.json";


export const EthNetworkIds = {
  'rinkeby': 4,
}

export type EthNetwork = 'rinkeby'

export function getRegistryAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0xFF01dD9876244b6D4835Deb8441f9605bFBdBfb3'
  }
  throw new Error('Unknown network ID')
}
export function getResolverAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0x4d8592961e2C68A0ce092D370EA2330B89091302'
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
