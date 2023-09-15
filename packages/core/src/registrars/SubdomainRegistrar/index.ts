import { BigNumber, ethers, providers } from 'ethers';
import {
  ApprovedRegistration,
  SubdomainBalanceVerificationResult,
  SubdomainEntry,
  SubdomainFees,
  OnDemandEntry,
  SelfRegEntry
} from '../types/Subdomain';
import { hash as hashName, normalize } from '@ensdomains/eth-ens-namehash';
import signTypedData from '../../utils/signTypedData';
import { increaseByPercent } from '../../utils/misc';
import { DURATION } from '../constants';
import { normalizeDuration } from '../utils';
import BaseRegistrar from '../BaseRegistrar';
import { SubdomainApproval } from '../../api';

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
  /**
   * Get subdomain registration approval for domain names owned by signer
   * @param {SelfRegEntry | Array<SelfRegEntry>} entry - list of domains and subdomains to register
   * @param {string} owner - ETH address of the owner of created subdomains, defaults to signer address
   * @param {boolean} isFeeInDWEB - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   */
  async approveSelfRegistration(
    entry: SelfRegEntry | Array<SelfRegEntry>,
    isFeeInDWEB: boolean = false,
    owner: string | null = null
  ): Promise<ApprovedRegistration> {
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const { payload, typedData } = await this.api.requestSelfSLDRegistration(
      signerAddress,
      ownerAddress,
      normalizedEntries,
      isFeeInDWEB
    );
    const signature = await signTypedData(this.signer, typedData);
    const approval = await this.api.approveSelfSLDRegistration({
      ...payload,
      signature
    });
    return {
      approval,
      owner: ownerAddress,
      isFeeInDWEB: isFeeInDWEB
    };
  }

  /**
   * Get subdomain registration approval for staked domain names
   * @param entry
   * @param owner
   * @param isFeeInDWEB - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   */
  async approveOndemandRegistration(
    entry: OnDemandEntry | Array<OnDemandEntry>,
    isFeeInDWEB: boolean = false,
    owner: string | null = null
  ): Promise<ApprovedRegistration> {
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const approval = await this.api.approveSLDRegistration(
      ownerAddress,
      normalizedEntries,
      isFeeInDWEB
    );
    return {
      approval,
      owner: ownerAddress,
      isFeeInDWEB: isFeeInDWEB
    };
  }

  async finishRegistration({
    approval,
    owner,
    isFeeInDWEB
  }: ApprovedRegistration): Promise<providers.TransactionResponse> {
    const {
      error: priceError,
      ownerFee,
      serviceFee
    } = await this.verifySignerBalance(approval, isFeeInDWEB);
    if (priceError) {
      throw new Error(priceError);
    }

    let baseCurrencyAmount = serviceFee.amount;
    if (serviceFee.currency === ownerFee.currency) {
      baseCurrencyAmount = baseCurrencyAmount.add(ownerFee.amount);
    }
    const safeAmount = increaseByPercent(baseCurrencyAmount, 10);

    const { v, r, s } = ethers.utils.splitSignature(approval.signature);
    const enc = new TextEncoder();
    const args = [
      approval.names.map((name) => hashName(name)),
      approval.labels.map((label) => ethers.utils.keccak256(enc.encode(label))),
      approval.domainowner,
      owner,
      this.chainId,
      approval.expiry,
      approval.durations,
      this.isMatic ? (isFeeInDWEB ? this.dwebToken.address : this.wethToken?.address) : isFeeInDWEB,
      approval.fee.map((i) => ethers.BigNumber.from(i)),
      approval.renewalFee.map((i) => ethers.BigNumber.from(i)),
      v,
      r,
      s,
      safeAmount
    ];
    return this.contract.createSubnodeBatch(args, { value: safeAmount });
  }

  /**
   * Verify that signer has enough balance to pay for registration
   * @param approval
   * @param isFeeInDWEB
   */
  async verifySignerBalance(approval: SubdomainApproval, isFeeInDWEB?: boolean) {
    const { serviceFee, ownerFee } = await this.calculateTotalFee(approval, isFeeInDWEB);
    const signerAddress = await this.signer.getAddress();
    const baseBalance = await this.provider.getBalance(signerAddress);
    let feeToken;
    switch (ownerFee.currency) {
      case 'DWEB':
        feeToken = this.dwebToken;
        break;
      case 'WETH':
        feeToken = this.wethToken;
        break;
      default:
        feeToken = null;
    }

    const result: SubdomainBalanceVerificationResult = {
      success: true,
      error: null,
      serviceFee,
      ownerFee
    };

    let safeBaseBalance;
    if (serviceFee.currency === ownerFee.currency) {
      safeBaseBalance = increaseByPercent(serviceFee.amount.add(ownerFee.amount), 10);
    } else {
      safeBaseBalance = increaseByPercent(serviceFee.amount, 10);
    }

    if (baseBalance.lt(safeBaseBalance)) {
      result.success = false;
      result.error = `Insufficient ${serviceFee.currency} balance. ${safeBaseBalance} wei needed, ${baseBalance} wei found.`;
      return result;
    }

    if (feeToken) {
      const [feeTokenBalance, feeTokenAllowance] = await Promise.all([
        feeToken.balanceOf(signerAddress),
        feeToken.allowance(signerAddress, this.contract.address)
      ]);
      if (feeTokenBalance.lt(ownerFee.amount)) {
        result.success = false;
        result.error = `Insufficient ${ownerFee.currency} balance. ${ownerFee.amount} wei needed, ${feeTokenBalance} wei found.`;
        return result;
      }
      if (feeTokenAllowance.lt(ownerFee.amount)) {
        result.success = false;
        result.error = `Insufficient ${ownerFee.currency} allowance. ${ownerFee.amount} wei needed, ${feeTokenAllowance} wei approved.`;
        return result;
      }
    }

    return result;
  }

  /**
   * Calculate total owner and service fee for approved subdomain registration
   * @param approval
   * @param isFeeInDWEB
   */
  async calculateTotalFee(
    approval: SubdomainApproval,
    isFeeInDWEB: boolean = false
  ): Promise<SubdomainFees> {
    const serviceFeeUSD = await this.getServiceFee();
    const serviceFee = await this.api.convertPrice(serviceFeeUSD);
    const renewalServiceFeeUSD = await this.getRenewalServiceFee();
    const renewalServiceFee = await this.api.convertPrice(renewalServiceFeeUSD);

    const totalOwnerFee = approval.fee.reduce((a, b) => a.add(b), BigNumber.from(0));
    const totalOwnerRenewalFee = approval.renewalFee.reduce((a, b) => a.add(b), BigNumber.from(0));

    const serviceFeeCurrency = this.isMatic ? 'MATIC' : 'ETH';
    const ownerFeeCurrency = isFeeInDWEB ? 'DWEB' : this.isMatic ? 'WETH' : 'ETH';
    const serviceFeeAmount = BigNumber.from(this.isMatic ? serviceFee.matic : serviceFee.eth);
    const renewalServiceFeeAmount = BigNumber.from(
      this.isMatic ? renewalServiceFee.matic : renewalServiceFee.eth
    );

    const totalServiceFee = serviceFeeAmount.mul(approval.labels.length);
    const totalRenewalServiceFee = approval.durations.reduce((total, duration) => {
      const renewalYears = duration > DURATION.ONE_YEAR ? duration / DURATION.ONE_YEAR - 1 : 0;
      return total.add(renewalServiceFeeAmount.mul(renewalYears));
    }, BigNumber.from(0));

    return {
      serviceFee: {
        currency: serviceFeeCurrency,
        amount: totalServiceFee.add(totalRenewalServiceFee)
      },
      ownerFee: {
        currency: ownerFeeCurrency,
        amount: totalOwnerFee.add(totalOwnerRenewalFee)
      }
    };
  }

  async normalizeEntries(
    entry: SubdomainEntry | Array<SubdomainEntry>
  ): Promise<Array<SubdomainEntry>> {
    const entries = Array.isArray(entry) ? entry : [entry];
    return entries.map((entry) => ({
      ...entry,
      name: normalize(entry.name),
      label: normalize(entry.label),
      duration: entry.duration ? normalizeDuration(entry.duration) : 0
    }));
  }

  /**
   * Get service fee for subdomain registration
   * @returns - fee in USD
   */
  async getServiceFee(): Promise<number> {
    const fee: BigNumber = await this.contract.subdomainFee();
    return fee.div(1000000).toNumber();
  }

  /**
   * Get service fee for subdomain renewal.
   * @returns - fee in USD
   */
  async getRenewalServiceFee(): Promise<number> {
    const fee: BigNumber = await this.contract.subdomainRenewalFee();
    return fee.div(1000000).toNumber();
  }
}

export default SubdomainRegistrar;
