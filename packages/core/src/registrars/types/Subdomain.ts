import { Approval } from '../../DecentrawebAPI/types/SubdomainApproval';
import { Price } from './common';

export interface Entry {
  name: string;
  label: string;
}

export interface ApprovedRegistration {
  approval: Approval;
  owner: string;
  isFeeInDWEB: boolean;
}

export interface Fees {
  ownerFee: Price<'ETH' | 'WETH' | 'DWEB'>;
  serviceFee: Price<'ETH' | 'MATIC'>;
}

export interface BalanceVerificationResult extends Fees {
  success: boolean;
  error: string | null;
}
