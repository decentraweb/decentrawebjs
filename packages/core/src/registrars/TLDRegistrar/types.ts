import { TransactionResponse } from 'ethers';
import { TLDApproval } from '../../api';
import { TLDEntry } from '../types/TLD';

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
  tx: TransactionResponse;
}

export type RegistrationContext = ApprovedRegistration | CommittedRegistration;
