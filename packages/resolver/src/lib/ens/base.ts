import {ethers, providers} from "ethers";
import {
  ENS as ensContract,
  PublicResolver as publicResolverContract,
  ReverseRegistrar as reverseRegistrarContract,
} from "@ensdomains/ens-contracts";


export const EthNetworkIds = {
  'mainnet': 1,
  'rinkeby': 4,
}

export type EthNetwork = 'mainnet' | 'rinkeby'

export function getEnsAddress(networkId: EthNetwork) {
  if (EthNetworkIds[networkId]) {
    return '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
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

export function getPublicResolverContract({address, provider}: ContractOptions) {
  return new ethers.Contract(address, publicResolverContract, provider)
}

export function getENSContract({address, provider}: ContractOptions) {
  return new ethers.Contract(address, ensContract, provider)
}

export function getReverseRegistrarContract({address, provider}: ContractOptions) {
  return new ethers.Contract(address, reverseRegistrarContract, provider)
}

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000'
