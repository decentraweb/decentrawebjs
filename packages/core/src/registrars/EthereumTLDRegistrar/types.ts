import { providers } from 'ethers';
import { TLDApproval } from '../../api/types.js';
import { TLDEntry } from '../types/TLD.js';

export interface BaseRegistrationContext extends TLDApproval {
  domains: TLDEntry[];
  owner: string;
  expiresAt: Date;
}

export interface ApprovedRegistration extends BaseRegistrationContext {
  status: 'approved';
}

export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  tx: providers.TransactionResponse;
  committedAt: Date;
}

export type RegistrationContext = ApprovedRegistration | CommittedRegistration;
