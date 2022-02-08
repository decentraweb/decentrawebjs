import {ethers, providers} from "ethers";
import {hash as namehash} from "@ensdomains/eth-ens-namehash";
import Name from "./Name";
import {
  EthNetwork,
  getEnsAddress,
  getENSContract,
  getResolverContract,
  getReverseRegistrarContract
} from "./base";

export type EnsConfig = {
  network?: EthNetwork,
  ensAddress?: string,
  provider: providers.BaseProvider,
  signer?: ethers.Signer
}

export default class ENS {
  provider: providers.BaseProvider
  ens: ethers.Contract
  signer?: ethers.Signer

  constructor(options: EnsConfig) {
    const { network, provider, ensAddress, signer } = options
    this.provider = provider
    this.signer = signer
    let ensContractAddress
    if(ensAddress){
      ensContractAddress = ensAddress
    } if(network) {
      ensContractAddress = getEnsAddress(network)
    } else {
      throw new Error('Either networkId or ensAddress must be provided')
    }
    this.ens = getENSContract({
      address: ensContractAddress,
      provider: provider,
    })
  }

  name(name: string) {
    return new Name({
      name,
      ens: this.ens,
      provider: this.provider,
      signer: this.signer,
    })
  }

  async getName(address: string) {
    const reverseNode = `${address.slice(2)}.addr.reverse`
    const resolverAddr = await this.ens.resolver(namehash(reverseNode))
    return this.getNameWithResolver(address, resolverAddr)
  }

  async getNameWithResolver(address: string, resolverAddr: string) {
    const reverseNode = `${address.slice(2)}.addr.reverse`
    const reverseNamehash = namehash(reverseNode)
    if (parseInt(resolverAddr, 16) === 0) {
      return {
        name: null,
      }
    }

    try {
      const Resolver = getResolverContract({
        address: resolverAddr,
        provider: this.provider,
      })
      const name = await Resolver.name(reverseNamehash)
      return {
        name,
      }
    } catch (e) {
      console.log(`Error getting name for reverse record of ${address}`, e)
    }
  }
}
