import {BigNumber} from "ethers";

export type Currency = 'ETH' | 'DWEB' | 'WETH' | 'MATIC';

export interface Price< C = Currency> {
  amount: BigNumber;
  currency: C;
}
