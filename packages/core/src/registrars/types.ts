import { BigNumber } from 'ethers';

export interface DomainEntry {
  name: string;
  duration: number;
}

export interface BalanceVerificationResult {
  success: boolean;
  error: string | null;
  price: BigNumber;
  safePrice: BigNumber;
  currency: 'ETH' | 'DWEB' | 'WETH';
}
