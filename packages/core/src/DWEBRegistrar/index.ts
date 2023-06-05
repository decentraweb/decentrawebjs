import { BigNumber, ethers, providers, Signer } from 'ethers';
import { DwebConfig } from '../types/common';
import DwebContractWrapper, { requiresSigner } from '../DwebContractWrapper';
import { normalize } from '@ensdomains/eth-ens-namehash';
import DecentrawebAPI from '../utils/DecentrawebAPI';
import { increaseByPercent } from '../utils/misc';
import { getContract, getContractConfig } from '../contracts';
import {
  ApprovedRegistration,
  BalanceVerificationResult,
  CommittedRegistration,
  RegistrationContext
} from './types';

export const DURATION = {
  ONE_YEAR: 31556926,
  TWO_YEARS: 63113852,
  THREE_YEARS: 94670778,
  FOUR_YEARS: 126227704,
  FIVE_YEARS: 157784630
};

export const MIN_DURATION = 31556926; // 1 year
export const MAX_DURATION = 157784630; // 5 years
export const MAX_NAMES_PER_TX = 20;

export const REGISTRATION_WAIT = 60 * 1000; // 1 minute

export const APPROVAL_TTL = 30 * 60; // 30 minutes

export interface DomainEntry {
  name: string;
  duration: number;
}

/*export type Progress =
  | { status: 'commitment'; request: ApprovedRequest; tx: providers.TransactionResponse }
  | { status: 'waiting'; request: ApprovedRequest }
  | { status: 'register'; request: ApprovedRequest; tx: providers.TransactionResponse };

export type ProgressCallback = (progress: Progress) => void;*/

export class DWEBRegistrar extends DwebContractWrapper {
  readonly api: DecentrawebAPI;
  readonly tokenContract: ethers.Contract;

  constructor(options: DwebConfig) {
    super(options, 'RootRegistrarController');
    this.api = new DecentrawebAPI(this.network);
    const contractConfig = getContractConfig(this.network);
    this.tokenContract = getContract({
      address: contractConfig.DecentraWebToken,
      name: 'DecentraWebToken',
      provider: this.provider
    });
  }

  /**
   * Normalizes domain names, calls the API to check if they are available and returns approval for registration
   * @param request
   * @param owner
   */
  @requiresSigner
  async requestApproval(
    request: DomainEntry | Array<DomainEntry>,
    owner?: string
  ): Promise<ApprovedRegistration> {
    const signer = this.signer as Signer;
    const signerAddress = await signer.getAddress();
    const nameOwner = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const requests = this.normalizeMintRequests(request);
    const normalizedNames = requests.map((item) => item.name);
    const approval = await this.api.approveRegistration(nameOwner, normalizedNames);
    return {
      ...approval,
      domains: requests,
      owner: nameOwner,
      expiresAt: new Date((approval.timestamp + APPROVAL_TTL) * 1000),
      status: 'approved'
    };
  }

  @requiresSigner
  async sendCommitment(request: ApprovedRegistration): Promise<CommittedRegistration> {
    const signature = ethers.utils.splitSignature(request.signature);
    const commitmentTx = await this.contract.commit(
      request.commitment,
      signature.v,
      signature.r,
      signature.s
    );
    await commitmentTx.wait(1);
    return {
      ...request,
      status: 'committed',
      committedAt: new Date()
    };
  }

  /**
   * Mint TLDs
   * @param request - approved registration request received from `requestApproval` method
   * @param isFeesInDweb - if true, fees will be paid in DWEB, otherwise in ETH
   * @param progressCb - callback to track the progress of the minting process
   */
  @requiresSigner
  async register(
    request: CommittedRegistration,
    isFeesInDweb: boolean
  ): Promise<providers.TransactionReceipt> {
    if (request.status !== 'committed') {
      throw new Error('Registration is not committed, call `sendCommitment` first');
    }

    if (request.committedAt.getTime() + REGISTRATION_WAIT > Date.now()) {
      throw new Error('Registration is not ready, wait for 1 minute after commitment');
    }

    const domains = request.domains;
    const normalizedNames = domains.map((item) => item.name);
    const durationArray = domains.map((item) => item.duration);
    const signer = this.signer as Signer;
    const { error: priceError, ethAmount } = await this.verifySignerBalance(
      request,
      isFeesInDweb,
      await signer.getAddress()
    );

    if (priceError) {
      throw new Error(priceError);
    }

    const registerTx = await this.contract.registerWithConfigBatch(
      normalizedNames,
      request.owner,
      durationArray,
      request.secret,
      this.chainId,
      request.timestamp,
      isFeesInDweb,
      ethAmount,
      { value: ethAmount }
    );
    return registerTx.wait(1);
  }

  /**
   * Check registration fees against user balance (DWEB and ETH) and return amount of ETH to be sent with the transaction
   * @param requests - array of TLDs to register
   * @param isFeesInDweb - if true, fees will be paid in DWEB, otherwise in ETH
   * @param signerAddress - address of the account that will pay the fees
   * @private
   */
  async verifySignerBalance(
    request: RegistrationContext,
    isFeesInDweb: boolean,
    signerAddress: string
  ): Promise<BalanceVerificationResult> {
    const rentPrice = await this.getRentPriceBatch(request.domains, isFeesInDweb);
    const [ethBalance, dwebBalance, dwebAllowance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      this.tokenContract.balanceOf(signerAddress),
      this.getDwebAllowance(signerAddress)
    ]);

    const result: BalanceVerificationResult = {
      success: true,
      error: null,
      ethAmount: isFeesInDweb ? BigNumber.from(0) : rentPrice,
      dwebAmount: isFeesInDweb ? rentPrice : BigNumber.from(0)
    };
    const safePrice = increaseByPercent(rentPrice, 10);

    if (isFeesInDweb) {
      if (dwebBalance.lt(safePrice)) {
        result.success = false;
        result.error = `Insufficient DWEB balance. ${safePrice} wei needed, ${dwebBalance} wei found.`;
      }
      if (dwebAllowance.lt(safePrice)) {
        result.success = false;
        result.error = `Insufficient DWEB allowance. ${safePrice} wei needed, ${dwebAllowance} wei approved.`;
      }
    }

    if (!isFeesInDweb && ethBalance.lt(safePrice)) {
      result.success = false;
      result.error = `Insufficient Ethereum funds. ${safePrice.toString()} wei needed, ${ethBalance.toString()} wei found.`;
    }

    return result;
  }

  normalizeMintRequests(requests: DomainEntry | Array<DomainEntry>): Array<DomainEntry> {
    const reqArray: Array<DomainEntry> = Array.isArray(requests) ? requests : [requests];
    if (reqArray.length > MAX_NAMES_PER_TX) {
      throw new Error(`Maximum number of names per transaction is ${MAX_NAMES_PER_TX}`);
    }
    return reqArray.map((item) => {
      let result: DomainEntry;
      try {
        result = {
          name: this.normalizeName(item.name),
          duration: this.normalizeDuration(item.duration)
        };
      } catch (e: any) {
        throw new Error(`Invalid mint request ${JSON.stringify(item)}: ${e.message}`);
      }
      return result;
    });
  }

  normalizeName(name: string): string {
    return normalize(name);
  }

  normalizeDuration(duration: any): number {
    if (!Number.isFinite(duration)) {
      throw new Error(`Duration must be a number`);
    }
    if (duration < MIN_DURATION || duration > MAX_DURATION) {
      throw new Error(`Duration must be between ${MIN_DURATION} and ${MAX_DURATION}`);
    }
    return duration;
  }

  async getRentPrice(req: DomainEntry, isFeesInDweb: boolean): Promise<BigNumber> {
    return await this.contract.rentPrice(
      this.normalizeName(req.name),
      this.normalizeDuration(req.duration),
      isFeesInDweb
    );
  }

  async getRentPriceBatch(requests: Array<DomainEntry>, isFeesInDweb: boolean): Promise<BigNumber> {
    let totalPrice = BigNumber.from(0);
    for (const name of requests) {
      const price = await this.getRentPrice(name, isFeesInDweb);
      totalPrice = totalPrice.add(price);
    }
    return totalPrice;
  }

  /**
   * Get the DWEB token amount that registrar is allowed to spend
   * @param account - ETH address of the account
   * @returns DWEB token amount in wei
   */
  async getDwebAllowance(account?: string): Promise<BigNumber> {
    const contractConfig = getContractConfig(this.network);
    return this.tokenContract.allowance(account, contractConfig.RootRegistrarController);
  }

  /**
   * Approve the DWEB token amount that can be used by the registrar
   * @param amount - amount of DWEB in wei
   */
  @requiresSigner
  async approveDwebUsageAmount(amount: BigNumber): Promise<providers.TransactionReceipt> {
    const contractConfig = getContractConfig(this.network);
    return this.tokenContract.approve(contractConfig.RootRegistrarController, amount, {
      value: '0x00'
    });
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
