import {BigNumber, providers} from 'ethers';
import { TLDApproval } from '../DecentrawebAPI/types';

export interface DomainEntry {
  name: string;
  duration: number;
}

export interface BalanceVerificationResult {
  success: boolean;
  error: string | null;
  ethAmount: BigNumber;
  dwebAmount: BigNumber;
}

export interface BaseRegistrationContext extends TLDApproval {
  domains: DomainEntry[];
  owner: string;
  expiresAt: Date;
}

export interface ApprovedRegistration extends BaseRegistrationContext {
  status: 'approved';
}

export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  commitmentTx: providers.TransactionResponse;
  committedAt: Date;
}

export interface DoneRegistration extends BaseRegistrationContext {
  status: 'done';
}

export type RegistrationContext = ApprovedRegistration | CommittedRegistration | DoneRegistration;
