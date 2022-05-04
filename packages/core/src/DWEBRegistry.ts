import {ethers, providers} from "ethers";
import {hash as namehash} from "@ensdomains/eth-ens-namehash";
import DWEBName from "./DWEBName";
import {
  DEFAULT_TTL,
  EthNetwork,
  getRegistryAddress,
  getRegistryContract,
  getResolverAddress,
} from "./utils/contracts";

export type EnsConfig = {
  network: EthNetwork,
  provider: providers.BaseProvider,
  signer?: ethers.Signer
}

export default class DWEBRegistry {
  network: EthNetwork
  provider: providers.BaseProvider
  private readonly contract: ethers.Contract
  signer?: ethers.Signer

  constructor(options: EnsConfig) {
    const {network, provider, signer} = options
    this.provider = provider
    this.signer = signer
    const registryContractAddress = getRegistryAddress(network)
    this.network = network;
    this.contract = getRegistryContract({
      address: registryContractAddress,
      provider: provider,
    })
  }

  private getWritableContract() {
    if (!this.signer) {
      throw new Error('DWEBRegistry is initialized in read-only mode. Provide signer to write data.')
    }
    return getRegistryContract({
      address: getRegistryAddress(this.network),
      provider: this.signer,
    })
  }

  name(name: string) {
    return new DWEBName({
      name,
      registry: this.contract,
      provider: this.provider,
      signer: this.signer,
    })
  }

  async assignDefaultResolver(name: string): Promise<providers.TransactionResponse> {
    const contract = this.getWritableContract();
    const hash = namehash(name);
    const defaultResolverAddress = getResolverAddress(this.network);
    return contract.setResolverAndTTL(hash, defaultResolverAddress, DEFAULT_TTL)
  }

  async setResolver(name: string, address: string): Promise<providers.TransactionResponse> {
    const contract = this.getWritableContract();
    const hash = namehash(name);
    return contract.setResolver(hash, address)
  }

}
