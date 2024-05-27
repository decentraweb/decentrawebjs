import { BigNumber, ethers, providers } from 'ethers';
import { ApprovedRegistration, CommittedRegistration, RegistrationContext } from './types';
import { TLDBalanceVerificationResult, TLDEntry } from '../types/TLD';
import { normalizeDomainEntries, normalizeDuration } from '../utils';
import { APPROVAL_TTL, REGISTRATION_WAIT } from '../constants';
import { RegistrarConfig } from '../BaseRegistrar';
import { Token } from '../../types/common';
import { validateFeeToken, ZERO_ADDRESS } from '../../tokens';
import BaseTLDRegistrar from '../BaseTLDRegistrar';

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
export class EthereumTLDRegistrar extends BaseTLDRegistrar {
  constructor(config: RegistrarConfig) {
    super(config, 'RootRegistrarController');
  }

  /**
   * Step 1. Normalizes domain names, calls the API to check if they are available and returns approval for registration.
   * Approved request is valid for 30 minutes.
   * @param request - one or more domain names and durations
   * @param feeToken - token to be used for registration fee. Supported tokens DWEB, USDT, USDC. Default is ETH
   * @param owner - ETH address of the owner of created TLDs
   * @returns - ApprovedRegistration object that can be used to commit and register
   */
  async requestApproval(
    request: TLDEntry | Array<TLDEntry>,
    feeToken?: Token,
    owner?: string
  ): Promise<ApprovedRegistration> {
    feeToken = validateFeeToken(this.network, feeToken);
    const signerAddress = await this.signer.getAddress();
    const nameOwner = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const entries = normalizeDomainEntries(request);
    const normalizedNames = entries.map((item) => item.name);

    const { error } = await this.verifySignerBalance(entries, feeToken);
    if (error) {
      throw error;
    }

    const approval = await this.api.approveTLDRegistration(nameOwner, normalizedNames, feeToken);
    return {
      ...approval,
      domains: entries,
      owner: nameOwner,
      expiresAt: new Date((approval.timestamp + APPROVAL_TTL) * 1000),
      status: 'approved'
    };
  }

  /**
   * Step 2. Creates a commitment for registration. Commitment is valid after 1 minute.
   * @param request - data returned from `requestApproval` step
   * @returns - commited registration object that can be used to register TLD
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
   * @returns - Transaction response for registration
   */
  async register(request: CommittedRegistration): Promise<providers.TransactionResponse> {
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
    const { error: priceError, safePrice } = await this.verifySignerBalance(
      request.domains,
      request.feeToken
    );

    if (priceError) {
      throw priceError;
    }

    return this.contract.registerWithConfigBatch(
      normalizedNames,
      request.owner,
      durationArray,
      request.secret,
      this.chainId,
      request.timestamp,
      request.feeTokenAddress,
      safePrice,
      { value: request.feeTokenAddress === ZERO_ADDRESS ? safePrice : BigNumber.from(0) }
    );
  }
}

export default EthereumTLDRegistrar;
