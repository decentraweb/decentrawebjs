import {ethers, providers} from "ethers";
import registryContract from "../contracts/DWEBRegistry.json";
import publicResolverContract from "../contracts/PublicResolver.json";


export const EthNetworkIds = {
  'rinkeby': 4,
}

export type EthNetwork = 'rinkeby'

export function getRegistryAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0xba4d288824ED9E810ddb8c05ceC021B3e2DE0d1C'
  }
  throw new Error('Unknown network ID')
}
export function getResolverAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0xC57fB913E64A928e6AB8443f22D0167A00F865a5'
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
