import { ChainId } from '../contracts/interfaces';

export interface TLDApprovalPayload {
  name: Array<string>;
  owner: string;
  secret: string;
  chainid: ChainId;
}

export interface TLDApprovalSuccess {
  commitment: string;
  signature: string;
  timestamp: number;
}

export interface TLDApprovalError {
  errorMessage: string;
  error: Array<{ errorCode: number; error: string }>;
}

export type TLDApprovalResponse = TLDApprovalSuccess | TLDApprovalError;

export interface TLDApproval {
  commitment: string;
  secret: string;
  signature: string;
  timestamp: number;
}

export enum StakingType {
  Public = 0,
  ADDRESS = 1,
  NFT = 2,
  ERC20 = 3
}

export type StakedDomain =
  | {
      staked: true;
      price: number;
      sldPerWallet: number;
      stakingType: StakingType;
    }
  | {
      staked: false;
    };

export interface SubdomainEntry {
  name: string;
  label: string;
}

export interface SLDApprovalPayload {
  name: string[];
  label: string[];
  owner: string;
  chainid: number;
  sender: string;
  isfeeindwebtoken: 0 | 1;
  signature?: string; //Signature is required for self registration. Empty string for on-demand registration
}

export interface SLDApproval {
  commitment: string; //Commitment value.
  signature: string; //Signature value. It is used in contract call
  expiry: number; //User has to complete within this timestamp. The duration is 30 min from the response generation timestamp
  names: string[]; //Array of parent domains
  labels: string[]; //Array of labels.
  fee: string[]; //Fee for SLD mint. It is the array of price that user has to pay for each sld
  domainowner: string[]; //tld owner to which the sld fee will be paid. There can be multiple different owner in single tx
}

export interface SLDApprovalError {
  error: string;
  errorMessage?: string;
}

export type SLDApprovalResponse = SLDApproval | SLDApprovalError;

export interface PriceConversionResponse {
  eth: string;
  dweb: string;
  matic?: string;
}
