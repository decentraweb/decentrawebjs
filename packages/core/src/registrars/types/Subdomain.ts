import { Price } from './common.js';
import { SubdomainApproval } from '../../api/index.js';

/**
 * Subdomain registration entry for registering subdomains for staked domains. Domain owned may specify if subdomains
 * will be renewable or not. If renewable, duration must be specified.
 */
export interface OnDemandEntry {
  /** Parent domain name */
  name: string;
  /** Subdomain name */
  label: string;
  /** Registration duration in seconds for renewable domains, minimum 1 year (31556926 seconds) */
  duration?: number;
}

/**
 * Subdomain registration entry for registering subdomains for domains owned by signer. When registering subdomains for
 * other addresses, owner can specify renewal fee. If fee set to 0 domain will be permanent. If fe is not 0, domain will
 * be renewable and duration must be specified. Signer has to pay service fee if registering for more than 1 year.
 */
export interface SelfRegEntry extends OnDemandEntry {
  /** Renewal fee in USD domain. If set to 0, domain will be permanent */
  renewalFee?: number;
}

export type SubdomainEntry = OnDemandEntry | SelfRegEntry;

/**
 * Subdomain registration approval object. Contains data required to register subdomains.
 */
export interface ApprovedRegistration {
  /** Approval received from the API */
  approval: SubdomainApproval;
  /** Domain owner address */
  owner: string;
  /** If true, domain owner registration fee will be paid in DWEB tokens, otherwise in ETH */
  isFeeInDWEB: boolean;
}

/**
 * Subdomain registration fees
 */
export interface SubdomainFees {
  /**
   * Fee paid to domain owner. Paid in ETH or DWEB on Ethereum, in WETH or DWEB on Polygon
   */
  ownerFee: Price<'ETH' | 'WETH' | 'DWEB'>;
  /**
   * Service fee paid to Decentraweb. Paid in ETH on Ethereum, in MATIC on Polygon
   */
  serviceFee: Price<'ETH' | 'MATIC'>;
}

/**
 * Resul of signer balance verification performed during subdomain registration.
 */
export interface SubdomainBalanceVerificationResult extends SubdomainFees {
  /** If true, signer balance is enough to pay for registration */
  success: boolean;
  /** If success is false, error message will be set */
  error: string | null;
}
