import { BigNumber } from 'ethers';
import {Approval} from "../utils/DecentrawebAPI";
import {DomainEntry} from "./index";

export interface BalanceVerificationResult {
  success: boolean;
  error: string | null;
  ethAmount: BigNumber;
  dwebAmount: BigNumber;
}

export interface BaseRegistrationContext extends Approval {
  domains: DomainEntry[];
  owner: string;
  expiresAt: Date;
}

export interface ApprovedRegistration extends BaseRegistrationContext {
  status: 'approved';

}

export interface CommittedRegistration extends BaseRegistrationContext {
  status: 'committed';
  committedAt: Date;
}

export interface DoneRegistration extends BaseRegistrationContext {
  status: 'done';
}

export type RegistrationContext = ApprovedRegistration | CommittedRegistration | DoneRegistration;
