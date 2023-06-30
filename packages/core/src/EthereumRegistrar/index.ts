import DecentrawebAPI from '../DecentrawebAPI';
import { BigNumber, ethers, providers, Wallet } from 'ethers';
import DwebContractWrapper, { requiresSigner } from '../DwebContractWrapper';
import { getContract } from '../contracts';
import {DwebConfig} from "../types/common";

export interface RegistrarConfig extends DwebConfig {
  signer: Wallet;
}

abstract class EthereumRegistrar extends DwebContractWrapper {
  readonly api: DecentrawebAPI;
  readonly signer: Wallet;
  readonly tokenContract: ethers.Contract;

  constructor(options: RegistrarConfig) {
    super(options, 'RootRegistrarController');
    this.api = new DecentrawebAPI(this.network);
    this.signer = options.signer;
    this.tokenContract = getContract({
      address: this.contractConfig.DecentraWebToken,
      name: 'DecentraWebToken',
      provider: this.provider,
      network: this.network
    });
  }

  /**
   * Get the DWEB token amount that registrar is allowed to spend
   * @param account - ETH address of the account
   * @returns DWEB token amount in wei
   */
  async getDwebAllowance(account?: string): Promise<BigNumber> {
    return this.tokenContract.allowance(account, this.contractConfig.RootRegistrarController);
  }

  /**
   * Approve the DWEB token amount that can be used by the registrar
   * @param amount - amount of DWEB in wei
   */
  @requiresSigner
  async approveDwebUsageAmount(amount: BigNumber): Promise<providers.TransactionReceipt> {
    const tx = this.tokenContract.approve(this.contractConfig.RootRegistrarController, amount, {
      value: '0x00'
    });
    return tx.wait(1);
  }

  /**
   * Approve unlimited DWEB token usage by the registrar, so no further approvals are needed
   */
  approveDwebUsage() {
    return this.approveDwebUsageAmount(
      ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), 'ether')
    );
  }
}

export default EthereumRegistrar;
