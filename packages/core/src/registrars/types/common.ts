import { BigNumber } from 'ethers';

export type Currency = 'ETH' | 'DWEB' | 'WETH' | 'MATIC';

/**
 * @typedef {Object} Price
 * @property {BigNumber} amount - price amount in wei
 * @property {Currency} currency - price currency
 */
export interface Price<C = Currency> {
  amount: BigNumber;
  currency: C;
}


export interface DomainInfo {
  name: string;
  exsists: boolean;

}
