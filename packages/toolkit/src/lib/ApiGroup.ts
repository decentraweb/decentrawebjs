import {ethers, providers} from "ethers";
import {DWEBRegistry, EthNetwork} from "@decentraweb/core";
export type ToolkitConfig = {
  network: EthNetwork,
  provider: providers.BaseProvider,
  signer?: ethers.Signer
}
export abstract class ApiGroup {
  network: EthNetwork
  readonly provider: providers.BaseProvider;
  readonly signer?: ethers.Signer
  protected dweb: DWEBRegistry;

  constructor(options: ToolkitConfig) {
    const {network, provider, signer} = options
    this.provider = provider
    this.signer = signer
    this.network = network;
    this.dweb = new DWEBRegistry(options);
  }
}

export default ApiGroup
