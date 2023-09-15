import { BigNumber } from 'ethers';

/**
 * Top level domain registration entry
 */
export interface TLDEntry {
  /** Domain name */
  name: string;
  /** Registration duration in seconds, minimum 1 year (31556926 seconds) */
  duration: number;
}

/**
 * Resul of signer balance verification performed before TLD registration.
 */
export interface TLDBalanceVerificationResult {
  success: boolean;
  error: string | null;
  /** Registration fee in wei. */
  price: BigNumber;
  /** Registration fee in wei + 10%. Used to prevent failed transactions due to price fluctuations. */
  safePrice: BigNumber;
  /** Currency used to pay for registration. ETH or DWEB on Ethereum, WETH or DWEB on Polygon. */
  currency: 'ETH' | 'DWEB' | 'WETH';
}
