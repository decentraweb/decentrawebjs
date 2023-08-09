import PolygonRegistrar from '../PolygonRegistrar';
import { hash as hashName, normalize } from '@ensdomains/eth-ens-namehash';
import { ApprovedRegistration, BalanceVerificationResult, Entry, Fees } from '../types/Subdomain';
import { BigNumber, ethers, providers } from 'ethers';
import signTypedData from '../../utils/signTypedData';
import { Approval } from '../../DecentrawebAPI/types/SubdomainApproval';
import { increaseByPercent } from '../../utils/misc';

class PolygonSubdomainRegistrar extends PolygonRegistrar {
  /**
   * Get subdomain registration approval for domain names owned by signer
   * @param {Entry | Array<Entry>} entry - list of domains and subdomains to register
   * @param {string} owner - ETH address of the owner of created subdomains, defaults to signer address
   */
  async approveSelfRegistration(
    entry: Entry | Array<Entry>,
    owner?: string | null
  ): Promise<ApprovedRegistration> {
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const { payload, typedData } = await this.api.requestSelfSLDRegistration(
      signerAddress,
      ownerAddress,
      normalizedEntries,
      false
    );
    const signature = await signTypedData(this.signer, typedData);
    const approval = await this.api.approveSelfSLDRegistration({
      ...payload,
      signature
    });
    return {
      approval,
      owner: ownerAddress,
      isFeeInDWEB: false
    };
  }

  /**
   * Get subdomain registration approval for staked domain names
   * @param entry
   * @param owner
   * @param isFeeInDWEB - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   */
  async approveOndemandRegistration(
    entry: Entry | Array<Entry>,
    owner?: string | null,
    isFeeInDWEB?: boolean
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
      isFeeInDWEB: !!isFeeInDWEB
    };
  }

  /**
   * Register subdomains
   * @param approvedSLDRegistration - result of approveSelfRegistration or approveOndemandRegistration
   */
  async registerSubdomains({
    approval,
    owner,
    isFeeInDWEB
  }: ApprovedRegistration): Promise<providers.TransactionResponse> {
    const { error: priceError, serviceFee } = await this.verifySignerBalance(approval, isFeeInDWEB);

    if (priceError) {
      throw new Error(priceError);
    }

    const { v, r, s } = ethers.utils.splitSignature(approval.signature);
    const enc = new TextEncoder();
    const safeServiceFee = increaseByPercent(serviceFee.amount, 10);
    const args = [
      approval.names.map((name) => hashName(name)),
      approval.labels.map((label) => ethers.utils.keccak256(enc.encode(label))),
      approval.domainowner,
      owner,
      this.chainId,
      approval.expiry,
      isFeeInDWEB,
      approval.fee.map((i) => BigNumber.from(i)),
      v,
      r,
      s,
      safeServiceFee
    ];
    return this.contract.createSubnodeBatch(args, { value: safeServiceFee });
  }

  async normalizeEntries(entry: Entry | Array<Entry>): Promise<Array<Entry>> {
    const entries = Array.isArray(entry) ? entry : [entry];
    return entries.map((entry) => ({
      name: normalize(entry.name),
      label: normalize(entry.label)
    }));
  }

  async verifySignerBalance(approval: Approval, isFeeInDWEB?: boolean) {
    const { serviceFee, ownerFee } = await this.calculateTotalFee(approval, isFeeInDWEB);
    const signerAddress = await this.signer.getAddress();
    const tokenContract = isFeeInDWEB ? this.dwebToken : this.wethToken;
    const [maticBalance, feeTokenBalance, feeTokenAllowance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      tokenContract.balanceOf(signerAddress),
      tokenContract.allowance(signerAddress)
    ]);
    const result: BalanceVerificationResult = {
      success: true,
      error: null,
      serviceFee,
      ownerFee
    };
    const safeServiceFee = increaseByPercent(serviceFee.amount, 10);
    if (feeTokenBalance.lt(ownerFee.amount)) {
      result.success = false;
      result.error = `Insufficient ${ownerFee.currency} balance. ${ownerFee.amount} wei needed, ${feeTokenBalance} wei found.`;
    }
    if (feeTokenAllowance.lt(ownerFee.amount)) {
      result.success = false;
      result.error = `Insufficient ${ownerFee.currency} allowance. ${ownerFee.amount} wei needed, ${feeTokenAllowance} wei approved.`;
    }

    if (maticBalance.lt(safeServiceFee)) {
      result.success = false;
      result.error = `Insufficient MATIC funds. ${safeServiceFee} wei needed, ${maticBalance} wei found.`;
    }

    return result;
  }

  async calculateTotalFee(approval: Approval, isFeeInDWEB?: boolean): Promise<Fees> {
    const serviceFeeUSD = await this.getServiceFee();
    const { matic: serviceFee } = await this.api.convertPrice(serviceFeeUSD.toNumber());
    const totalServiceFee = BigNumber.from(serviceFee).mul(approval.labels.length);
    const totalFee = approval.fee.reduce((a, b) => a.add(b), BigNumber.from(0));
    return {
      serviceFee: { currency: 'MATIC', amount: totalServiceFee },
      ownerFee: { currency: isFeeInDWEB ? 'DWEB' : 'WETH', amount: totalFee }
    };
  }

  async getServiceFee(): Promise<BigNumber> {
    const fee: BigNumber = await this.contract.subdomainFee();
    return fee.div(1000000);
  }
}

export default PolygonSubdomainRegistrar;
