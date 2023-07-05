import { BigNumber, ethers, providers } from 'ethers';
import { normalize } from '@ensdomains/eth-ens-namehash';
import { increaseByPercent } from '../utils/misc';
import {
  ApprovedRegistration,
  BalanceVerificationResult,
  CommittedRegistration,
  DomainEntry,
  RegistrationContext
} from './types';
import EthereumRegistrar from '../EthereumRegistrar';

export {
  ApprovedRegistration,
  BalanceVerificationResult,
  CommittedRegistration,
  DomainEntry,
  RegistrationContext
};

/**
 * Standard duration values for registration.
 */
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

/**
 * Time to live for registration approval.
 */
export const APPROVAL_TTL = 30 * 60; // 30 minutes
/**
 * Time to wait before calling `register` after `sendCommitment` call.
 */
export const REGISTRATION_WAIT = 60 * 1000; // 1 minute

/**
 * Ethereum TLD Registrar class. Provides methods to register top level domains.
 */
export class EthereumTLDRegistrar extends EthereumRegistrar {
  /**
   * Step 1. Normalizes domain names, calls the API to check if they are available and returns approval for registration.
   * Approved request is valid for 30 minutes.
   * @param request
   * @param owner
   * @returns {Promise<ApprovedRegistration>} ApprovedRegistration object that can be used to commit and register
   */
  async requestApproval(
    request: DomainEntry | Array<DomainEntry>,
    owner?: string
  ): Promise<ApprovedRegistration> {
    const signerAddress = await this.signer.getAddress();
    const nameOwner = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const requests = this.normalizeDomainEntries(request);
    const normalizedNames = requests.map((item) => item.name);
    const approval = await this.api.approveTLDRegistration(nameOwner, normalizedNames);
    return {
      ...approval,
      domains: requests,
      owner: nameOwner,
      expiresAt: new Date((approval.timestamp + APPROVAL_TTL) * 1000),
      status: 'approved'
    };
  }

  /**
   * Step 2. Creates a commitment for registration. Commitment is valid for 1 minute.
   * @param {ApprovedRegistration} request - data returned from `requestApproval` step
   * @returns {Promise<CommittedRegistration>} CommittedRegistration object that can be used to register TLD
   */
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
   * Step 3. Finish TLD registration. This step can be called only 1 minute after `sendCommitment` step was completed.
   * Also, it will throw an error if signer balance is not enough to pay for registration. Registration considered
   * successful after 1st confirmation received.
   * @param {CommittedRegistration} request - data returned from `sendCommitment` step
   * @param {boolean} isFeesInDweb - if true, fees will be paid in DWEB tokens, otherwise in ETH
   * @returns {Promise<providers.TransactionReceipt>} Transaction receipt for registration
   */
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
    const { error: priceError, ethAmount } = await this.verifySignerBalance(request, isFeesInDweb);

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
   * Returns the price of registration in ETH and DWEB tokens and verifies if signer has enough balance to pay for registration.
   * @param request
   * @param isFeesInDweb
   */
  async verifySignerBalance(
    request: RegistrationContext,
    isFeesInDweb: boolean
  ): Promise<BalanceVerificationResult> {
    const signerAddress = await this.signer.getAddress();
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

  /**
   * Validates and normalizes domain names and durations for registration.
   * @param requests
   */
  normalizeDomainEntries(requests: DomainEntry | Array<DomainEntry>): Array<DomainEntry> {
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

  /**
   * Returns the price of registration in wei
   * @param {DomainEntry} entry - domain name and duration
   * @param {boolean} isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   * @returns {Promise<BigNumber>} - amount in wei
   */
  async getRentPrice(
    { name, duration }: DomainEntry,
    isFeesInDweb: boolean = false
  ): Promise<BigNumber> {
    return await this.contract.rentPrice(
      this.normalizeName(name),
      this.normalizeDuration(duration),
      isFeesInDweb
    );
  }

  /**
   * Returns the price of registration in wei for multiple domains
   * @param {Array<DomainEntry>} requests - array of domain names and durations
   * @param {boolean} isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   * @returns {Promise<BigNumber>} - total amount in wei
   */
  async getRentPriceBatch(requests: Array<DomainEntry>, isFeesInDweb: boolean): Promise<BigNumber> {
    let totalPrice = BigNumber.from(0);
    for (const name of requests) {
      const price = await this.getRentPrice(name, isFeesInDweb);
      totalPrice = totalPrice.add(price);
    }
    return totalPrice;
  }
}

export default EthereumTLDRegistrar;
