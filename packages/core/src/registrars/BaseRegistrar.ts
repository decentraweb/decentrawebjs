import DwebContractWrapper from '../DwebContractWrapper';
import {EthNetwork} from '../contracts/interfaces';
import {BigNumber, ethers, providers, Signer} from 'ethers';
import { getContract, getWethContract } from '../contracts';
import DecentrawebAPI from '../DecentrawebAPI';
import {DwebConfig} from "../types/common";

export interface RegistrarConfig extends DwebConfig {
  signer: Signer;
}

abstract class BaseRegistrar extends DwebContractWrapper {
  readonly network: EthNetwork;
  readonly api: DecentrawebAPI;
  readonly signer: Signer;
  readonly dwebToken: ethers.Contract;
  readonly wethToken?: ethers.Contract;

  constructor(options: RegistrarConfig) {
    super(options, 'RootRegistrarController');
    this.network = options.network;
    this.api = new DecentrawebAPI(this.network);
    this.signer = options.signer;
    this.dwebToken = getContract({
      address: this.contractConfig.DecentraWebToken,
      name: 'DecentraWebToken',
      provider: this.signer,
      network: this.network
    });
    switch (this.network) {
      case 'matic':
      case 'maticmum':
        this.wethToken = getWethContract(this.network, this.signer);
    }
  }

  get isMatic() {
    return this.network === 'matic' || this.network === 'maticmum';
  }

  /**
   * Approve the DWEB token amount that can be used by the registrar
   * @param {'WETH' | 'DWEB'} token - token name
   * @param {BigNumber} amount - amount in wei
   * @returns {Promise<providers.TransactionReceipt>}
   */
  async setTokenAllowance(
    token: 'WETH' | 'DWEB',
    amount: BigNumber
  ): Promise<providers.TransactionReceipt> {
    switch (token) {
      case 'DWEB': {
        const tx = await this.dwebToken.approve(this.contract.address, amount, {
          value: '0x00'
        });
        return tx.wait(1);
      }
      case 'WETH': {
        if(!this.isMatic){
          throw new Error('WETH is only supported on the Polygon network');
        }
        const tx = await this.wethToken?.approve(this.contract.address, amount, {
          value: '0x00'
        });
        return tx.wait(1);
      }
    }
  }

  /**
   * Approve unlimited token usage by the registrar, so no further approvals are needed
   */
  async allowTokenUsage(token: 'WETH' | 'DWEB') {
    return this.setTokenAllowance(
      token,
      ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), 'ether')
    );
  }
}

export default BaseRegistrar;
