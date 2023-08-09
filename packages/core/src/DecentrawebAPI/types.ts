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

export interface PriceConversionResponse {
  eth: string;
  dweb: string;
  matic?: string;
}
