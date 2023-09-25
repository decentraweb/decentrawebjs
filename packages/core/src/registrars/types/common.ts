import { BigNumber } from 'ethers';

export type Currency = 'ETH' | 'DWEB' | 'WETH' | 'MATIC';

/**
 * Price object
 */
export interface Price<C = Currency> {
  /** price amount in wei */
  amount: BigNumber;
  /** price currency */
  currency: C;
}
