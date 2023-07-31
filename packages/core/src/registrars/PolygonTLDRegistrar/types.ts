import { DomainEntry } from '../types';
import { BigNumber } from 'ethers';

export interface BaseRegistrationContext {
  domains: DomainEntry[];
  owner: string;
  expiresAt: Date;
  isFeesInDweb: boolean;
  fee: BigNumber;
}

export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  data: {
    secret: string;
    timestamp: number;
  }
}

export interface DoneRegistration extends BaseRegistrationContext {
  status: 'done';
  data: {
    txid: string;
  }
}
