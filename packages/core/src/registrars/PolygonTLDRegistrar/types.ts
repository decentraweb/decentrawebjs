import { TLDEntry } from '../types/TLD';
import { BigNumber } from 'ethers';

/**
 * @property domains - array of name and duration pairs
 * @property owner - domain owner address
 * @property expiresAt - date when the approval expires
 * @property isFeesInDweb - true if fees are paid in DWEB, false if fees are paid in ETH
 * @property fee - total fee in wei
 */
export interface BaseRegistrationContext {
  domains: TLDEntry[];
  owner: string;
  expiresAt: Date;
  isFeesInDweb: boolean;
  fee: BigNumber;
}

/**
 * @extends BaseRegistrationContext
 * @property status - 'committed'
 * @property data - data needed to complete the registration
 */
export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  data: {
    secret: string;
    timestamp: number;
  };
}
