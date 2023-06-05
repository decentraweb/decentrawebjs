import { ContractConfig, DwebContract, EthNetwork } from './contracts/interfaces';
import { ethers, providers } from 'ethers';
import { DwebConfig } from './types/common';
import { getContract, getContractConfig } from './contracts';
import { getChainId } from './utils/ethereum';

export function requiresSigner(target: any, ctx: DecoratorContext): any {
  return function (this: DwebContractWrapper, ...args: any[]) {
    if (!this.signer) {
      throw new Error('Provide signer to call non-constant methods');
    }
    return target.apply(this, args);
  };
}

abstract class DwebContractWrapper {
  readonly network: EthNetwork;
  readonly chainId: number;
  readonly provider: providers.BaseProvider;
  readonly signer?: ethers.Signer;
  protected readonly contract: ethers.Contract;
  readonly contractConfig: ContractConfig;

  get readonly(): boolean {
    return !this.signer;
  }

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
      provider: signer || provider
    });
  }
}

export default DwebContractWrapper;
