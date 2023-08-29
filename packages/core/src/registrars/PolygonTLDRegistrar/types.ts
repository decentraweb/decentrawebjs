import { DomainEntry } from '../types/TLD';
import { BigNumber } from 'ethers';
/**
 * @typedef {Object} BaseRegistrationContext
 * @property {DomainEntry[]} domains - array of name and duration pairs
 * @property {string} owner - domain owner address
 * @property {Date} expiresAt - date when the approval expires
 * @property {boolean} isFeesInDweb - true if fees are paid in DWEB, false if fees are paid in ETH
 * @property {BigNumber} fee - total fee in wei
*/
export interface BaseRegistrationContext {
  domains: DomainEntry[];
  owner: string;
  expiresAt: Date;
  isFeesInDweb: boolean;
  fee: BigNumber;
}

/**
 * @typedef {Object} CommittedRegistration
 * @extends BaseRegistrationContext
 * @property {string} status - 'committed'
 * @property {Object} data - data needed to complete the registration
 */
export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  data: {
    secret: string;
    timestamp: number;
  };
}

/**
 * @typedef {Object} DoneRegistration
 * @extends BaseRegistrationContext
 * @property {string} status - 'done'
 * @property {Object} data - registration data
 * @property {string} data.txid - registration transaction id on Polygon
 */
export interface DoneRegistration extends BaseRegistrationContext {
  status: 'done';
  data: {
    txid: string;
  };
}
