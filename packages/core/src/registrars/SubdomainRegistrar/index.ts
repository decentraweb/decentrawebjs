import { Contract, ethers, TransactionResponse } from 'ethers';
import {
  ApprovedRegistration,
  OnDemandEntry,
  SelfRegEntry,
  SubdomainBalanceVerificationResult,
  SubdomainEntry,
  SubdomainFees
} from '../types/Subdomain';
import signTypedData from '../../utils/signTypedData';
import { increaseByPercent } from '../../utils/misc';
import { DURATION } from '../constants';
import { normalizeDuration } from '../utils';
import { getContract } from '../../contracts';
import BaseRegistrar, { RegistrarConfig } from '../BaseRegistrar';
import { hashName, normalizeName } from '../../utils';
import { InsufficientAllowanceError, InsufficientBalanceError } from '../../errors';
import { Token } from '../../types/common';
import {
  getFeeTokenAddress,
  getTokenContract,
  isValidNativeToken,
  validateFeeToken
} from '../../tokens';

/**
 * Class that handles subdomain registration.
 * Registration is done in 2 steps:
 * 1. Calling {@link approveSelfRegistration} or {@link approveOndemandRegistration} to get registration approval.
 * 2. Calling {@link finishRegistration} to finish registration.
 * @example
 * Register subdomain "john" for domain "wallet" owned by signer and pay in ETH
 * ```ts
 * const subdomainRegistrar = new SubdomainRegistrar({
 *   network: network,
 *   provider: provider,
 *   signer: signer
 * });
 * const registration = await subdomainRegistrar.approveSelfRegistration({ name: 'wallet', label: 'john' });
 * const tx = await subdomainRegistrar.finishRegistration(registration);
 * await tx.wait(1);
 *  ```
 */
class SubdomainRegistrar extends BaseRegistrar {
  readonly tldRegistrarContract: Contract;

  constructor(config: RegistrarConfig) {
    super(config, 'RootRegistrarControllerSld');
    this.tldRegistrarContract = getContract({
      address: this.contractConfig['RootRegistrarController'],
      name: 'RootRegistrarController',
      provider: this.signer || this.provider,
      network: this.network
    });
  }

  /**
   * Get subdomain registration approval for domain names owned by signer
   * @param {SelfRegEntry | Array<SelfRegEntry>} entry - list of domains and subdomains to register
   * @param {Token} feeToken - token to pay for registration, defaults to ETH/MATIC depending on network
   * @param {string} owner - ETH address of the owner of created subdomains, defaults to signer address
   */
  async approveSelfRegistration(
    entry: SelfRegEntry | Array<SelfRegEntry>,
    feeToken?: Token,
    owner?: string
  ): Promise<ApprovedRegistration> {
    feeToken = validateFeeToken(this.network, feeToken);
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const { payload, typedData } = await this.api.requestSelfSLDRegistration(
      signerAddress,
      ownerAddress,
      normalizedEntries,
      feeToken
    );
    const signature = await signTypedData(this.signer, typedData);
    const approval = await this.api.approveSelfSLDRegistration({
      ...payload,
      signature
    });
    return {
      approval,
      owner: ownerAddress,
      feeToken
    };
  }

  /**
   * Get subdomain registration approval for staked domain names
   * @param entry
   * @param feeToken - token to pay for registration, defaults to ETH/MATIC depending on network
   * @param owner
   */
  async approveOndemandRegistration(
    entry: OnDemandEntry | Array<OnDemandEntry>,
    feeToken?: Token,
    owner: string | null = null
  ): Promise<ApprovedRegistration> {
    feeToken = validateFeeToken(this.network, feeToken);
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const approval = await this.api.approveSLDRegistration(
      ownerAddress,
      normalizedEntries,
      feeToken
    );
    return {
      approval,
      owner: ownerAddress,
      feeToken
    };
  }

  /**
   * Finish subdomain registration
   * @param approval - approval object received from `approveSelfRegistration` or `approveOndemandRegistration`
   */
  async finishRegistration(registration: ApprovedRegistration): Promise<TransactionResponse> {
    const { approval, owner, feeToken } = registration;
    const {
      error: priceError,
      ownerFee,
      serviceFee
    } = await this.verifySignerBalance(registration);
    if (priceError) {
      throw priceError;
    }

    let baseCurrencyAmount = serviceFee.amount;
    if (serviceFee.currency === ownerFee.currency) {
      baseCurrencyAmount = baseCurrencyAmount + ownerFee.amount;
    }
    const safeAmount = increaseByPercent(baseCurrencyAmount, 10);

    const sig = ethers.Signature.from(approval.signature);
    const { v, r, s } = sig;
    const enc = new TextEncoder();
    const args = [
      approval.names.map((name) => hashName(name)),
      approval.labels.map((label) => ethers.keccak256(enc.encode(label))),
      approval.domainowner,
      owner,
      this.chainId,
      approval.expiry,
      approval.durations,
      getFeeTokenAddress(this.network, feeToken),
      approval.fee.map((i) => BigInt(i)),
      approval.renewalFee.map((i) => BigInt(i)),
      v,
      r,
      s
    ];
    return this.contract.createSubnodeBatch(args, { value: safeAmount });
  }

  /**
   * Verify that signer has enough balance to pay for registration
   * @param approval - approval object received from `approveSelfRegistration` or `approveOndemandRegistration`
   * @param feeToken - token to pay for registration, defaults to ETH/MATIC depending on network
   */
  async verifySignerBalance(
    registration: ApprovedRegistration
  ): Promise<SubdomainBalanceVerificationResult> {
    const { feeToken } = registration;
    const { serviceFee, ownerFee } = await this.calculateTotalFee(registration);
    const signerAddress = await this.signer.getAddress();
    const nativeBalance = await this.provider.getBalance(signerAddress);
    const isPaidWithNative = !feeToken || isValidNativeToken(this.network, feeToken);

    const result: SubdomainBalanceVerificationResult = {
      success: true,
      error: null,
      serviceFee,
      ownerFee
    };

    let safeNativeBalance;
    if (isPaidWithNative) {
      safeNativeBalance = increaseByPercent(serviceFee.amount + ownerFee.amount, 10);
    } else {
      safeNativeBalance = increaseByPercent(serviceFee.amount, 10);
    }

    if (nativeBalance < safeNativeBalance) {
      result.success = false;
      result.error = new InsufficientBalanceError(
        nativeBalance,
        safeNativeBalance,
        serviceFee.currency
      );
      return result;
    }

    if (!isPaidWithNative) {
      const tokenContract = getTokenContract(this.network, feeToken, this.signer);
      const [feeTokenBalance, feeTokenAllowance] = await Promise.all([
        tokenContract.balanceOf(signerAddress) as Promise<bigint>,
        tokenContract.allowance(signerAddress, await this.contract.getAddress()) as Promise<bigint>
      ]);
      if (feeTokenBalance < ownerFee.amount) {
        result.success = false;
        result.error = new InsufficientBalanceError(
          feeTokenBalance,
          ownerFee.amount,
          ownerFee.currency
        );
        return result;
      }
      if (feeTokenAllowance < ownerFee.amount) {
        result.success = false;
        result.error = new InsufficientAllowanceError(
          feeTokenAllowance,
          ownerFee.amount,
          ownerFee.currency
        );
        return result;
      }
    }

    return result;
  }

  /**
   * Calculate total owner and service fee for approved subdomain registration
   * @param registration - approved registration object received from `approveSelfRegistration` or `approveOndemandRegistration`
   */
  async calculateTotalFee(registration: ApprovedRegistration): Promise<SubdomainFees> {
    const { approval, feeToken } = registration;
    const serviceFeeUSD = await this.getServiceFee();
    const serviceFee = await this.api.convertPrice(serviceFeeUSD);
    const renewalServiceFeeUSD = await this.getRenewalServiceFee();
    const renewalServiceFee = await this.api.convertPrice(renewalServiceFeeUSD);

    const totalOwnerFee = approval.fee.reduce((a, b) => a + BigInt(b), BigInt(0));
    const totalOwnerRenewalFee = approval.renewalFee.reduce((a, b) => a + BigInt(b), BigInt(0));

    const serviceFeeAmount = serviceFee.native;
    const renewalServiceFeeAmount = renewalServiceFee.native;
    const totalServiceFee = serviceFeeAmount * BigInt(approval.labels.length);
    const totalRenewalServiceFee = approval.durations.reduce((total, duration) => {
      const renewalYears = duration > DURATION.ONE_YEAR ? duration / DURATION.ONE_YEAR - 1 : 0;
      return total + renewalServiceFeeAmount * BigInt(renewalYears);
    }, BigInt(0));

    return {
      serviceFee: {
        currency: this.isMatic ? 'MATIC' : 'ETH',
        amount: totalServiceFee + totalRenewalServiceFee
      },
      ownerFee: {
        currency: feeToken,
        amount: totalOwnerFee + totalOwnerRenewalFee
      }
    };
  }

  async normalizeEntries(
    entry: SubdomainEntry | Array<SubdomainEntry>
  ): Promise<Array<SubdomainEntry>> {
    const entries = Array.isArray(entry) ? entry : [entry];
    return entries.map((entry) => ({
      ...entry,
      name: normalizeName(entry.name),
      label: normalizeName(entry.label),
      duration: entry.duration ? normalizeDuration(entry.duration) : 0
    }));
  }

  /**
   * Get service fee for subdomain registration
   * @returns - fee in USD
   */
  async getServiceFee(): Promise<number> {
    const fee: bigint = await this.tldRegistrarContract.subdomainFee();
    return Number(fee / BigInt(1000000));
  }

  /**
   * Get service fee for subdomain renewal.
   * @returns - fee in USD
   */
  async getRenewalServiceFee(): Promise<number> {
    const fee: bigint = await this.tldRegistrarContract.subdomainRenewalFee();
    return Number(fee / BigInt(1000000));
  }
}

export default SubdomainRegistrar;
