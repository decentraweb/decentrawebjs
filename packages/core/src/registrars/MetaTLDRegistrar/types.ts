import { TLDEntry } from '../types/TLD';
import { BigNumber, providers } from 'ethers';
import { Token } from '../../types/common';

/**
 * @property domains - array of name and duration pairs
 * @property owner - domain owner address
 * @property expiresAt - date when the approval expires
 * @property feeToken - token used for registration fee. Default is MATIC
 * @property feeTokenAddress - address of the fee token. ERC20 address or zeroes for MATIC
 * @property fee - total fee in wei
 */
export interface BaseRegistrationContext {
  domains: TLDEntry[];
  owner: string;
  expiresAt: Date;
  feeToken: Token;
  feeTokenAddress: string;
  fee: BigNumber;
}

/**
 * @extends BaseRegistrationContext
 * @property status - 'committed'
 * @property tx - commitment transaction response
 * @property data - data needed to complete the registration
 */
export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  tx: providers.TransactionResponse;
  data: {
    secret: string;
    timestamp: number;
  };
}
