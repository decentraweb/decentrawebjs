import DwebContractWrapper from '../../DwebContractWrapper';
import DecentrawebAPI from '../../DecentrawebAPI';
import { BigNumber, ethers, providers, Wallet } from 'ethers';
import { EthNetwork } from '../../contracts/interfaces';
import { RegistrarConfig } from '../EthereumRegistrar';
import {
  ApprovedRegistration,
  BalanceVerificationResult,
  Entry,
  Fees,
  OnDemandEntry,
  SelfRegEntry
} from '../types/Subdomain';
import { hash as hashName, normalize } from '@ensdomains/eth-ens-namehash';
import signTypedData from '../../utils/signTypedData';
import { getContract, getWethContract } from '../../contracts';
import { Approval } from '../../DecentrawebAPI/types/SubdomainApproval';
import { increaseByPercent } from '../../utils/misc';

class SubdomainRegistrar extends DwebContractWrapper {
  readonly network: EthNetwork;
  readonly api: DecentrawebAPI;
  readonly signer: Wallet;
  readonly dwebToken: ethers.Contract;
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

  get isMatic() {
    return this.network === 'matic' || this.network === 'maticmum';
  }

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

  async verifySignerBalance(approval: Approval, isFeeInDWEB?: boolean) {
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

    const result: BalanceVerificationResult = {
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

  async calculateTotalFee(approval: Approval, isFeeInDWEB: boolean = false): Promise<Fees> {
    const serviceFeeUSD = await this.getServiceFee();
    const converted = await this.api.convertPrice(serviceFeeUSD);
    const totalFee = approval.fee.reduce((a, b) => a.add(b), BigNumber.from(0));
    if (this.isMatic) {
      const amount = converted.matic as BigNumber;
      return {
        serviceFee: {
          currency: 'MATIC',
          amount: amount.mul(approval.labels.length)
        },
        ownerFee: { currency: isFeeInDWEB ? 'DWEB' : 'WETH', amount: totalFee }
      };
    }

    return {
      serviceFee: {
        currency: 'ETH',
        amount: BigNumber.from(converted.eth).mul(approval.labels.length)
      },
      ownerFee: { currency: isFeeInDWEB ? 'DWEB' : 'ETH', amount: totalFee }
    };
  }

  async normalizeEntries(entry: Entry | Array<Entry>): Promise<Array<Entry>> {
    const entries = Array.isArray(entry) ? entry : [entry];
    return entries.map((entry) => ({
      name: normalize(entry.name),
      label: normalize(entry.label)
    }));
  }

  async getServiceFee(): Promise<number> {
    const fee: BigNumber = await this.contract.subdomainFee();
    return fee.div(1000000).toNumber();
  }

  async getRenewalServiceFee(): Promise<number> {
    const fee: BigNumber = await this.contract.subdomainRenewalFee();
    return fee.div(1000000).toNumber();
  }
}

export default SubdomainRegistrar;
