import DwebContractWrapper from '../DwebContractWrapper.js';
import { BigNumber, ethers, providers, Signer } from 'ethers';
import { getContract, getWethContract } from '../contracts/index.js';
import DecentrawebAPI from '../api/index.js';
import { DwebConfig, Network } from '../types/common.js';
import { NotStakedDomain, StakedDomain, StakingState } from './types/StakingState.js';

/**
 * Configuration for the registrar
 * @property signer - Ethers.js Ethereum signer for writing data to the blockchain (required)
 */
export interface RegistrarConfig extends DwebConfig {
  signer: Signer;
}

/**
 * Base class for all registrars
 */
abstract class BaseRegistrar extends DwebContractWrapper {
  /** Current network name */
  readonly network: Network;
  /** DecentraWeb API wrapper instance */
  readonly api: DecentrawebAPI;
  /** Ethers.js Ethereum signer for writing data to the blockchain */
  readonly signer: Signer;
  /** DWEB token contract */
  readonly dwebToken: ethers.Contract;
  /** WETH token contract, only available on the Polygon network */
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

  /**
   * Is the registrar on the Polygon network
   */
  get isMatic() {
    return this.network === 'matic' || this.network === 'maticmum';
  }

  /**
   * Approve the DWEB token amount that can be used by the registrar contract
   * @param token - token name. WETH is only supported on the Polygon network
   * @param amount - amount in wei
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
        if (!this.isMatic) {
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
   * Approve unlimited token usage by the registrar contract, so no further approvals are needed
   * @param token - token name. WETH is only supported on the Polygon network
   */
  async allowTokenUsage(token: 'WETH' | 'DWEB') {
    return this.setTokenAllowance(
      token,
      ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), 'ether')
    );
  }

  /**
   * Check staking status of a list of domains
   * @param domains - list of domains to check
   */
  async stakingStatus(domains: string[]): Promise<StakingState[]> {
    const data = await this.api.getStakedDomains(domains);
    return data.map((d, index) => {
      if (!d.staked) {
        return {
          name: domains[index],
          staked: false
        } as NotStakedDomain;
      }
      let stakingType: string;
      switch (d.stakingType) {
        case 0:
          stakingType = 'public';
          break;
        case 1:
          stakingType = 'address';
          break;
        case 2:
          stakingType = 'nft';
          break;
        case 3:
          stakingType = 'erc20';
          break;
        default:
          throw new Error(`Unknown staking type: ${d.stakingType}`);
      }
      let renewalType: string;
      switch (d.renewalType) {
        case 0:
          renewalType = 'permanent';
          break;
        case 1:
          renewalType = 'renewed';
          break;
        default:
          throw new Error(`Unknown renewal type: ${d.renewalType}`);
      }
      return {
        name: domains[index],
        staked: true,
        price: d.price,
        sldPerWallet: d.sldPerWallet,
        stakingType: stakingType,
        renewalType: renewalType,
        renewalFee: d.renewalFee
      } as StakedDomain;
    });
  }
}

export default BaseRegistrar;
