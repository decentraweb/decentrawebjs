import { Approval } from '../../DecentrawebAPI/types/SubdomainApproval';
import { Price } from './common';

/**
 * @typedef {Object} OnDemandEntry
 * @property {string} name - parent domain name
 * @property {string} label - subdomain name
 * @property {number} [duration] - registration duration in seconds for renewable domains, mimimum 1 year (31556926 seconds)
 */
export interface OnDemandEntry {
  name: string;
  label: string;
  duration?: number;
}

/**
 * @typedef {Object} SelfRegEntry
 * @extends OnDemandEntry
 * @property {number} [renewalFee] - renewal fee in USD for renewable domains. Overrides fee set when domain was staked
 */
export interface SelfRegEntry extends OnDemandEntry {
  renewalFee?: number;
}

export type Entry = OnDemandEntry | SelfRegEntry;

export interface ApprovedRegistration {
  approval: Approval;
  owner: string;
  isFeeInDWEB: boolean;
}

/**
 * @typedef {Object} Fees
 * @property {Price<'ETH' | 'WETH' | 'DWEB'>} ownerFee - fee paid to domain owner. Paid in ETH or DWEB on Ethereum, in WETH or DWEB on Polygon
 * @property {Price<'ETH' | 'MATIC'>} serviceFee - fee paid to Decentraweb. Paid in ETH on Ethereum, in MATIC on Polygon
 */
export interface Fees {
  ownerFee: Price<'ETH' | 'WETH' | 'DWEB'>;
  serviceFee: Price<'ETH' | 'MATIC'>;
}

export interface BalanceVerificationResult extends Fees {
  success: boolean;
  error: string | null;
}
