import BaseRegistrar from './BaseRegistrar';
import { TLDBalanceVerificationResult, TLDEntry } from './types/TLD';
import {
  getFeeTokenAddress,
  getTokenContract,
  isValidAltToken,
  isValidNativeToken,
  validateFeeToken
} from '../tokens';
import { increaseByPercent } from '../utils/misc';
import { InsufficientAllowanceError, InsufficientBalanceError } from '../errors';
import { Token } from '../types/common';
import { BigNumber } from 'ethers';
import { normalizeName } from '../utils';
import { normalizeDomainEntries, normalizeDuration } from './utils';

abstract class BaseTLDRegistrar extends BaseRegistrar {
  /**
   * Returns the price of registration and verifies if signer has enough balance to pay for registration.
   * @param request
   */
  async verifySignerBalance(
    entries: TLDEntry | Array<TLDEntry>,
    feeToken?: Token
  ): Promise<TLDBalanceVerificationResult> {
    entries = normalizeDomainEntries(entries);
    feeToken = validateFeeToken(this.network, feeToken);
    const signerAddress = await this.signer.getAddress();
    const rentPrice = await this.getRentPriceBatch(entries, feeToken);
    const isPaidWithNative = !feeToken || isValidNativeToken(this.network, feeToken);
    let tokenContract;
    if (!isPaidWithNative) {
      if (!isValidAltToken(this.network, feeToken)) {
        throw new Error(
          `Token "${feeToken}" is not supported for registration fee on this network`
        );
      }
      tokenContract = getTokenContract(this.network, feeToken, this.provider);
    }

    const [ethBalance, tokenBalance, tokenAllowance] = await Promise.all([
      this.provider.getBalance(signerAddress),
      tokenContract?.balanceOf(signerAddress),
      tokenContract?.allowance(signerAddress, this.contract.address)
    ]);
    const safePrice = increaseByPercent(rentPrice, 10);
    const result: TLDBalanceVerificationResult = {
      success: true,
      error: null,
      price: rentPrice,
      safePrice,
      currency: feeToken
    };

    if (!isPaidWithNative) {
      if (tokenBalance.lt(safePrice)) {
        result.success = false;
        result.error = new InsufficientBalanceError(tokenBalance, safePrice, feeToken);
      }
      if (tokenAllowance.lt(safePrice)) {
        result.success = false;
        result.error = new InsufficientAllowanceError(tokenAllowance, safePrice, feeToken);
      }
    } else if (ethBalance.lt(safePrice)) {
      result.success = false;
      result.error = new InsufficientBalanceError(ethBalance, safePrice, 'ETH');
    }

    return result;
  }

  /**
   * Returns the price of registration in wei
   * @param entry - domain name and duration
   * @param feeToken - token to be used for registration fee. Supported tokens DWEB, USDT, USDC. Also accepts WETH on Polygon
   * @returns - amount in wei
   */
  async getRentPrice({ name, duration }: TLDEntry, feeToken?: Token): Promise<BigNumber> {
    return await this.contract.rentPrice(
      normalizeName(name),
      normalizeDuration(duration),
      getFeeTokenAddress(this.network, feeToken)
    );
  }

  /**
   * Returns the price of registration in wei for multiple domains
   * @param entries - array of domain names and durations
   * @param feeToken - token to be used for registration fee. Supported tokens DWEB, USDT, USDC. Also accepts WETH on Polygon
   * @returns - total amount in wei
   */
  async getRentPriceBatch(entries: Array<TLDEntry>, feeToken?: Token): Promise<BigNumber> {
    let totalPrice = BigNumber.from(0);
    for (const entry of entries) {
      const price = await this.getRentPrice(entry, feeToken);
      totalPrice = totalPrice.add(price);
    }
    return totalPrice;
  }
}

export default BaseTLDRegistrar;
