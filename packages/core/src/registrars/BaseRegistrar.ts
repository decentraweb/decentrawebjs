import DwebContractWrapper from '../DwebContractWrapper';
import { ethers, Signer } from 'ethers';
import DecentrawebAPI from '../api';
import { AltToken, DwebConfig, DwebContract, Network, Token } from '../types/common';
import { NotStakedDomain, StakedDomain, StakingState } from './types/StakingState';
import { isMaticChain } from '../utils/chains';
import { getTokenAddress, getTokenContract, ZERO_ADDRESS } from '../tokens';

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

  constructor(options: RegistrarConfig, contractName: DwebContract) {
    super(options, contractName);
    this.network = options.network;
    this.api = new DecentrawebAPI(this.network);
    this.signer = options.signer;
  }

  /**
   * Is the registrar on the Polygon network
   */
  get isMatic() {
    return isMaticChain(this.network);
  }

  feeTokenAddress(token?: Token): string {
    if (!token) {
      return ZERO_ADDRESS;
    }
    token = token.toUpperCase() as Token;
    if (token === 'ETH') {
      if (!this.isMatic) {
        return ZERO_ADDRESS;
      }
      throw new Error('ETH is not supported on the Polygon network, you can use WETH instead');
    }
    if (token === 'MATIC') {
      if (this.isMatic) {
        return ZERO_ADDRESS;
      }
      throw new Error('MATIC is not supported on the Ethereum network');
    }
    const address = getTokenAddress(this.network, token);
    if (!address) {
      throw new Error(`Token "${token}" is not supported on "${this.network}" network.`);
    }
    return address;
  }

  /**
   * Approve the DWEB/WETH/USDT/USDC token amount that can be used by the registrar contract
   * @param token - token name. WETH is only supported on the Polygon network
   * @param amount - amount in wei
   */
  async setTokenAllowance(token: AltToken, amount: bigint): Promise<ethers.TransactionReceipt> {
    const contract = getTokenContract(this.network, token, this.signer);
    const targetAddress = await this.contract.getAddress();
    const tx = await contract.approve(targetAddress, amount);
    return tx.wait(1);
  }

  /**
   * Get DWEB/WETH/USDT/USDC token amount that can be used by the registrar contract
   * @param token - token name. WETH is only supported on the Polygon network
   */
  async getTokenAllowance(token: AltToken): Promise<bigint> {
    const signerAddress = await this.signer.getAddress();
    const contract = getTokenContract(this.network, token, this.provider);
    return contract.allowance(signerAddress, await this.contract.getAddress());
  }

  /**
   * Get DWEB/WETH/USDT/USDC token balance of the signer
   * @param token - token name. WETH is only supported on the Polygon network
   */
  async getTokenBalance(token: AltToken): Promise<bigint> {
    const signerAddress = await this.signer.getAddress();
    const contract = getTokenContract(this.network, token, this.provider);
    return contract.balanceOf(signerAddress);
  }

  /**
   * Approve unlimited token usage by the registrar contract, so no further approvals are needed
   * @param token - token name. WETH is only supported on the Polygon network
   */
  async allowTokenUsage(token: AltToken) {
    return this.setTokenAllowance(
      token,
      ethers.parseUnits(Number.MAX_SAFE_INTEGER.toString(), 'ether')
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
