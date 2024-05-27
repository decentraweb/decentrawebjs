import { BigNumber } from 'ethers';
import { Token } from '../../types/common';

/**
 * Price object
 */
export interface Price<C = Token> {
  /** price amount in wei */
  amount: BigNumber;
  /** price currency */
  currency: C;
}
