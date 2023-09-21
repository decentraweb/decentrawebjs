import { BigNumber, ethers, providers } from 'ethers';

import { increaseByPercent } from '../../utils/misc.js';
import { ApprovedRegistration, CommittedRegistration, RegistrationContext } from './types.js';
import { TLDBalanceVerificationResult, TLDEntry } from '../types/TLD.js';
import { normalizeDomainEntries, normalizeDuration } from '../utils.js';
import { APPROVAL_TTL, REGISTRATION_WAIT } from '../constants.js';
import BaseRegistrar from '../BaseRegistrar.js';
import { normalizeName } from '../../utils/name.js';

export type {
  ApprovedRegistration,
  TLDBalanceVerificationResult,
  CommittedRegistration,
  TLDEntry,
  RegistrationContext
};

/**
 * Class that handles TLD registration on Ethereum network.
 * Registration is done in 4 steps:
 * 1. Calling {@link requestApproval} to get registration approval.
 * 2. Calling {@link sendCommitment} to create commitment for registration.
 * 3. Waiting for 1 minute.
 * 4. Calling {@link register} to finish registration.
 *
 * **Note:** After approval is receieved, domain will be reserved for 30 minutes. Since process may fail on one of following steps,
 * it is recommended to save result of each step to be able to continue in case of failure.
 * @example
 * ```ts
 * import { registration } from '@decentraweb/core';
 * const registrar = new registration.EthereumTLDRegistrar({
 *   network: network,
 *   provider: provider,
 *   signer: signer
 * });
 * const approval = await registrar.requestApproval({ name: 'wallet', duration: registration.DURATION.ONE_YEAR });
 * const commitment = await registrar.sendCommitment(approval);
 * await commitment.tx.wait(1);
 * // Wait for 1 minute
 * const tx = await registrar.register(commitment);
 * await tx.wait(1);
 * ```
 */
export class EthereumTLDRegistrar extends BaseRegistrar {
  /**
   * Step 1. Normalizes domain names, calls the API to check if they are available and returns approval for registration.
   * Approved request is valid for 30 minutes.
   * @param request - one or more domain names and durations
   * @param owner - ETH address of the owner of created TLDs
   * @returns - ApprovedRegistration object that can be used to commit and register
   */
  async requestApproval(
    request: TLDEntry | Array<TLDEntry>,
    owner?: string
  ): Promise<ApprovedRegistration> {
    const signerAddress = await this.signer.getAddress();
    const nameOwner = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const requests = normalizeDomainEntries(request);
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
   * Step 2. Creates a commitment for registration. Commitment is valid after 1 minute.
   * @param request - data returned from `requestApproval` step
   * @returns - object that can be used to register TLD
   */
  async sendCommitment(request: ApprovedRegistration): Promise<CommittedRegistration> {
    const signature = ethers.utils.splitSignature(request.signature);
    const commitmentTx = await this.contract.commit(
      request.commitment,
      signature.v,
      signature.r,
      signature.s
    );
    return {
      ...request,
      status: 'committed',
      tx: commitmentTx,
      committedAt: new Date()
    };
  }

  /**
   * Step 3. Finish TLD registration. This step can be called only 1 minute after `sendCommitment` step was completed.
   * Also, it will throw an error if signer balance is not enough to pay for registration. Registration considered
   * successful after 1st confirmation received.
   * @param request - data returned from `sendCommitment` step
   * @param isFeesInDweb - if true, fees will be paid in DWEB tokens, otherwise in ETH
   * @returns - Transaction response for registration
   */
  async register(
    request: CommittedRegistration,
    isFeesInDweb: boolean = false
  ): Promise<providers.TransactionResponse> {
    if (request.status !== 'committed') {
      throw new Error('Registration is not committed, call `sendCommitment` first');
    }
    // Make sure that commitment transaction has at least 1 confirmation
    await request.tx.wait(1);

    if (request.committedAt.getTime() + REGISTRATION_WAIT > Date.now()) {
      throw new Error('Registration is not ready, wait for 1 minute after commitment');
    }

    const domains = request.domains;
    const normalizedNames = domains.map((item) => item.name);
    const durationArray = domains.map((item) => item.duration);
    const { error: priceError, safePrice } = await this.verifySignerBalance(request, isFeesInDweb);

    if (priceError) {
      throw new Error(priceError);
    }

    return this.contract.registerWithConfigBatch(
      normalizedNames,
      request.owner,
      durationArray,
      request.secret,
      this.chainId,
      request.timestamp,
      isFeesInDweb,
      safePrice,
      { value: isFeesInDweb ? BigNumber.from(0) : safePrice }
    );
  }

  /**
   * Returns the price of registration in ETH and DWEB tokens and verifies if signer has enough balance to pay for registration.
   * @param request
   * @param isFeesInDweb
   */
  async verifySignerBalance(
    request: RegistrationContext,
    isFeesInDweb: boolean
  ): Promise<TLDBalanceVerificationResult> {
    const signerAddress = await this.signer.getAddress();
    const rentPrice = await this.getRentPriceBatch(request.domains, isFeesInDweb);
    const [ethBalance, dwebBalance, dwebAllowance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      this.dwebToken.balanceOf(signerAddress),
      this.dwebToken.allowance(signerAddress, this.contract.address)
    ]);
    const safePrice = increaseByPercent(rentPrice, 10);
    const result: TLDBalanceVerificationResult = {
      success: true,
      error: null,
      price: rentPrice,
      safePrice,
      currency: isFeesInDweb ? 'DWEB' : 'ETH'
    };

    if (isFeesInDweb) {
      if (dwebBalance.lt(safePrice)) {
        result.success = false;
        result.error = `Insufficient DWEB balance. ${safePrice} wei needed, ${dwebBalance} wei found.`;
      }
      if (dwebAllowance.lt(safePrice)) {
        result.success = false;
        result.error = `Insufficient DWEB allowance. ${safePrice} wei needed, ${dwebAllowance} wei approved.`;
      }
    } else if (ethBalance.lt(safePrice)) {
      result.success = false;
      result.error = `Insufficient Ethereum funds. ${safePrice.toString()} wei needed, ${ethBalance.toString()} wei found.`;
    }

    return result;
  }

  /**
   * Returns the price of registration in wei
   * @param entry - domain name and duration
   * @param isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   * @returns - amount in wei
   */
  async getRentPrice(
    { name, duration }: TLDEntry,
    isFeesInDweb: boolean = false
  ): Promise<BigNumber> {
    return await this.contract.rentPrice(
      normalizeName(name),
      normalizeDuration(duration),
      isFeesInDweb
    );
  }

  /**
   * Returns the price of registration in wei for multiple domains
   * @param requests - array of domain names and durations
   * @param isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   * @returns - total amount in wei
   */
  async getRentPriceBatch(requests: Array<TLDEntry>, isFeesInDweb: boolean): Promise<BigNumber> {
    let totalPrice = BigNumber.from(0);
    for (const name of requests) {
      const price = await this.getRentPrice(name, isFeesInDweb);
      totalPrice = totalPrice.add(price);
    }
    return totalPrice;
  }
}

export default EthereumTLDRegistrar;
