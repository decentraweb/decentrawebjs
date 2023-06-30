import { getContract } from '../contracts';
import { BigNumber, ethers, providers } from 'ethers';
import { hash as hashName, normalize } from '@ensdomains/eth-ens-namehash';
import signTypedData from '../utils/signTypedData';
import { SLDApproval } from '../DecentrawebAPI/types';
import EthereumRegistrar from '../EthereumRegistrar';
import { BalanceVerificationResult } from '../EthereumTLDRegistrar';
import { increaseByPercent } from '../utils/misc';

export interface Entry {
  name: string;
  label: string;
}

export interface NormalizedEntry extends Entry {
  nameOwner: string;
}

export interface ApprovedSLDRegistration {
  approval: SLDApproval;
  owner: string;
  isFeeInDWEB: boolean;
}

export const SERVICE_FEE_USD = 2;

export class EthereumSLDRegistrar extends EthereumRegistrar {
  async approveSelfRegistration(
    entry: Entry | Array<Entry>,
    owner?: string | null,
    isFeeInDWEB?: boolean
  ): Promise<ApprovedSLDRegistration> {
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const notOwned = normalizedEntries.filter((entry) => entry.nameOwner !== signerAddress);
    if (notOwned.length > 0) {
      throw new Error(
        `The following names are not owned by ${signerAddress}: ${notOwned
          .map((entry) => entry.name)
          .join(', ')}`
      );
    }
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
      isFeeInDWEB: !!isFeeInDWEB
    };
  }

  async approveOndemandRegistration(
    entry: Entry | Array<Entry>,
    owner?: string | null,
    isFeeInDWEB?: boolean
  ): Promise<ApprovedSLDRegistration> {
    const signerAddress = await this.signer.getAddress();
    const ownerAddress = owner ? ethers.utils.getAddress(owner) : signerAddress;
    const normalizedEntries = await this.normalizeEntries(entry);
    const approval = await this.api.approveSLDRegistration(
      signerAddress,
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

  async registerSubdomains({
    approval,
    owner,
    isFeeInDWEB
  }: ApprovedSLDRegistration): Promise<providers.TransactionReceipt> {
    const { error: priceError, ethAmount } = await this.verifySignerBalance(approval, isFeeInDWEB);

    if (priceError) {
      throw new Error(priceError);
    }

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
      ethAmount
    ];
    const tx = await this.contract.createSubnodeBatch(args);
    return tx.wait(1);
  }

  async normalizeEntries(entry: Entry | Array<Entry>): Promise<Array<NormalizedEntry>> {
    const registry = getContract({
      address: this.contractConfig.DWEBRegistry,
      name: 'DWEBRegistry',
      provider: this.provider,
      network: this.network
    });
    const entries = Array.isArray(entry) ? entry : [entry];
    return Promise.all(
      entries.map(async (entry) => {
        const nameHash = hashName(entry.name);
        return {
          name: normalize(entry.name),
          label: normalize(entry.label),
          nameOwner: await registry['owner(bytes32)'](nameHash)
        };
      })
    );
  }

  async verifySignerBalance(approval: SLDApproval, isFeeInDWEB?: boolean) {
    const { eth: ethAmount, dweb: dwebAmount } = await this.calculateTotalFee(
      approval,
      isFeeInDWEB
    );
    const signerAddress = await this.signer.getAddress();
    const [ethBalance, dwebBalance, dwebAllowance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      this.tokenContract.balanceOf(signerAddress),
      this.getDwebAllowance(signerAddress)
    ]);
    const result: BalanceVerificationResult = {
      success: true,
      error: null,
      ethAmount,
      dwebAmount
    };
    const safeEthFee = increaseByPercent(ethAmount, 10);
    if (isFeeInDWEB) {
      if (dwebBalance.lt(dwebAmount)) {
        result.success = false;
        result.error = `Insufficient DWEB balance. ${dwebAmount} wei needed, ${dwebBalance} wei found.`;
      }
      if (dwebAllowance.lt(dwebAmount)) {
        result.success = false;
        result.error = `Insufficient DWEB allowance. ${dwebAmount} wei needed, ${dwebAllowance} wei approved.`;
      }
    }

    if (!isFeeInDWEB && ethBalance.lt(safeEthFee)) {
      result.success = false;
      result.error = `Insufficient Ethereum funds. ${safeEthFee.toString()} wei needed, ${ethBalance.toString()} wei found.`;
    }

    return result;
  }

  async calculateTotalFee(
    approval: SLDApproval,
    isFeeInDWEB?: boolean
  ): Promise<{
    eth: BigNumber;
    dweb: BigNumber;
  }> {
    const { eth: serviceFee } = await this.api.convertPrice(SERVICE_FEE_USD);
    const totalServiceFee = BigNumber.from(serviceFee).mul(approval.labels.length);
    const totalFeeUSD = approval.fee.reduce((a, b) => a + parseFloat(b), 0);
    const { eth: totalFeeEth, dweb: totalFeeDweb } = await this.api.convertPrice(totalFeeUSD);

    return {
      eth: isFeeInDWEB ? totalServiceFee : totalServiceFee.add(totalFeeEth),
      dweb: isFeeInDWEB ? BigNumber.from(totalFeeDweb) : BigNumber.from(0)
    };
  }
}

export default EthereumSLDRegistrar;