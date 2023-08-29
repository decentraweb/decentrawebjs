import { ChainId } from '../contracts/interfaces';
import {BigNumber} from "ethers";

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
  Address = 1,
  NFT = 2,
  ERC20 = 3
}

export enum RenewalType {
  Permanent = 0,
  Renewed = 1
}

export type StakedDomain =
  | {
      staked: true;
      price: number;
      sldPerWallet: number;
      stakingType: StakingType;
      renewalType: RenewalType;
      renewalFee: number;
}
  | {
      staked: false;
    };

export interface PriceConversionResponse {
  eth: string[];
  dweb: string[];
  matic?: string[];
}

export interface PriceConversionResult {
  usd: number;
  eth: BigNumber;
  dweb: BigNumber;
  matic?: BigNumber;
}
