import { ethers, providers } from 'ethers';
import { ContractConfig, DwebConfig, DwebContract, Network } from './types/common.js';
import { getContract, getContractConfig } from './contracts/index.js';
import { getChainId } from './utils/ethereum.js';

export function requiresSigner(target: any, ctx: DecoratorContext): any {
  return function (this: DwebContractWrapper, ...args: any[]) {
    if (!this.signer) {
      throw new Error('Provide signer to call non-constant methods');
    }
    return target.apply(this, args);
  };
}

abstract class DwebContractWrapper {
  readonly network: Network;
  readonly chainId: number;
  readonly provider: providers.BaseProvider;
  readonly signer?: ethers.Signer;
  readonly contractConfig: ContractConfig;
  protected readonly contract: ethers.Contract;

  protected constructor(options: DwebConfig, contractName: DwebContract) {
    const { network, provider, signer } = options;
    this.chainId = getChainId(network);
    this.provider = provider;
    this.signer = signer;
    this.network = network;
    this.contractConfig = options.contracts || getContractConfig(network);
    this.contract = getContract({
      address: this.contractConfig[contractName],
      name: contractName,
      provider: signer || provider,
      network: this.network
    });
  }

  get readonly(): boolean {
    return !this.signer;
  }
}

export default DwebContractWrapper;
