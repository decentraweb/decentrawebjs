import { Token } from '../../types/common';

/**
 * Price object
 */
export interface Price<C = Token> {
  /** price amount in wei */
  amount: bigint;
  /** price currency */
  currency: C;
}
