import DwebContractWrapper from '../../DwebContractWrapper';
import { PolygonNetwork } from '../../contracts/interfaces';
import { BigNumber, ethers, providers, Wallet } from 'ethers';
import { getContract, getWethContract } from '../../contracts';
import { RegistrarConfig } from '../EthereumRegistrar';
import DecentrawebAPI from "../../DecentrawebAPI";

interface PolygonRegistrarConfig extends RegistrarConfig {
  network: PolygonNetwork;
}

class PolygonRegistrar extends DwebContractWrapper {
  readonly network: PolygonNetwork;
  readonly api: DecentrawebAPI;
  readonly signer: Wallet;
  readonly dwebToken: ethers.Contract;
  readonly wethToken: ethers.Contract;

  constructor(options: PolygonRegistrarConfig) {
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
    this.wethToken = getWethContract(this.network, this.signer);
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
        const tx = await this.wethToken.approve(this.contract.address, amount, {
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

export default PolygonRegistrar;
