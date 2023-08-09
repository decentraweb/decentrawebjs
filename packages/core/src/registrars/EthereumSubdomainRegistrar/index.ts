import { BigNumber, ethers, providers } from 'ethers';
import { hash as hashName, normalize } from '@ensdomains/eth-ens-namehash';
import signTypedData from '../../utils/signTypedData';
import { Approval } from '../../DecentrawebAPI/types/SubdomainApproval';
import { ApprovedRegistration, BalanceVerificationResult, Entry, Fees } from '../types/Subdomain';
import EthereumRegistrar from '../EthereumRegistrar';
import { increaseByPercent } from '../../utils/misc';

export class EthereumSLDRegistrar extends EthereumRegistrar {
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
    const {
      error: priceError,
      ownerFee,
      serviceFee
    } = await this.verifySignerBalance(approval, isFeeInDWEB);

    if (priceError) {
      throw new Error(priceError);
    }
    const ethAmount = isFeeInDWEB ? serviceFee.amount : serviceFee.amount.add(ownerFee.amount);
    const safeEthAmount = increaseByPercent(ethAmount, 10);

    const { v, r, s } = ethers.utils.splitSignature(approval.signature);
    const enc = new TextEncoder();
    const args = [
      approval.names.map((name) => hashName(name)),
      approval.labels.map((label) => ethers.utils.keccak256(enc.encode(label))),
      approval.domainowner,
      owner,
      this.chainId,
      approval.expiry,
      isFeeInDWEB,
      approval.fee.map((i) => ethers.BigNumber.from(i)),
      v,
      r,
      s,
      safeEthAmount
    ];
    return this.contract.createSubnodeBatch(args, { value: safeEthAmount });
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
    const [ethBalance, dwebBalance, dwebAllowance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      this.tokenContract.balanceOf(signerAddress),
      this.getDwebAllowance(signerAddress)
    ]);
    const result: BalanceVerificationResult = {
      success: true,
      error: null,
      serviceFee,
      ownerFee
    };
    const ethAmount = isFeeInDWEB ? serviceFee.amount : serviceFee.amount.add(ownerFee.amount);
    const safeEthAmount = increaseByPercent(ethAmount, 10);
    if (isFeeInDWEB) {
      const safeDwebAmount = increaseByPercent(ownerFee.amount, 10);
      if (dwebBalance.lt(safeDwebAmount)) {
        result.success = false;
        result.error = `Insufficient DWEB balance. ${safeDwebAmount} wei needed, ${dwebBalance} wei found.`;
      }
      if (dwebAllowance.lt(safeDwebAmount)) {
        result.success = false;
        result.error = `Insufficient DWEB allowance. ${safeDwebAmount} wei needed, ${dwebAllowance} wei approved.`;
      }
    }

    if (ethBalance.lt(safeEthAmount)) {
      result.success = false;
      result.error = `Insufficient Ethereum funds. ${safeEthAmount.toString()} wei needed, ${ethBalance.toString()} wei found.`;
    }

    return result;
  }

  async calculateTotalFee(approval: Approval, isFeeInDWEB?: boolean): Promise<Fees> {
    const serviceFeeUSD = await this.getServiceFee();
    const { eth: serviceFee } = await this.api.convertPrice(serviceFeeUSD.toNumber());
    const totalServiceFee = BigNumber.from(serviceFee).mul(approval.labels.length);
    const totalFee = approval.fee.reduce((a, b) => a.add(b), BigNumber.from(0));
    return {
      serviceFee: { currency: 'ETH', amount: totalServiceFee },
      ownerFee: { currency: isFeeInDWEB ? 'DWEB' : 'ETH', amount: totalFee }
    };
  }

  async getServiceFee(): Promise<BigNumber> {
    const fee: BigNumber = await this.contract.subdomainFee();
    return fee.div(1000000);
  }
}

export default EthereumSLDRegistrar;
