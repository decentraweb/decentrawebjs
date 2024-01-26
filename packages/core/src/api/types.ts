import { BigNumber } from 'ethers';
import { ChainId, EthChainId, PolygonChainId } from '../types/common';

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

export type TLDApprovalRes = TLDApprovalSuccess | TLDApprovalError;

export interface TLDApproval {
  commitment: string;
  secret: string;
  signature: string;
  timestamp: number;
}

export interface PolyTLDCommitmentPayload {
  name: string[];
  secret: string;
  signature: string;
  owner: string;
}

export interface PolyTLDCommitmentRes {
  txid: string;
  commitment: string;
  chainId: PolygonChainId;
  timestamp: number;
}

export interface RequestPolyTLDRegistrationPayload {
  name: string[];
  duration: number[];
  secret: string;
  owner: string;
  timestamp: number;
  feeTokenAddress: string;
  fee: string;
}

export interface SubmitPolyTLDRegistrationPayload extends RequestPolyTLDRegistrationPayload {
  signature: string;
}

export interface PolyTLDRegistrationRes {
  txid: string;
}

export interface SubdomainApprovalPayloadBase {
  name: string[];
  label: string[];
  owner: string;
  chainid: number;
  sender: string;
  signature?: string; //Signature is required for self registration. Empty string for on-demand registration
  duration: number[];
  renewalFee?: string[];
}

export interface EthSubdomainApprovalPayload extends SubdomainApprovalPayloadBase {
  chainid: EthChainId;
  isFeeInDWEBToken: Boolean;
}

export interface PolySubdomainApprovalPayload extends SubdomainApprovalPayloadBase {
  chainid: PolygonChainId;
  feeTokenAddress: string;
}

export type SubdomainApprovalPayload = EthSubdomainApprovalPayload | PolySubdomainApprovalPayload;

export interface SubdomainApproval {
  commitment: string; //Commitment value.
  signature: string; //Signature value. It is used in contract call
  expiry: number; //User has to complete within this timestamp. The duration is 30 min from the response generation timestamp
  names: string[]; //Array of parent domains
  labels: string[];
  durations: number[];
  renewalFee: number[]; //Array of labels.
  fee: string[]; //Fee for SLD mint. It is the array of price that user has to pay for each sld
  domainowner: string[]; //tld owner to which the sld fee will be paid. There can be multiple different owner in single tx
}

export interface SubdomainApprovalError {
  error: string;
  errorMessage?: string;
}

export type SubdomainApprovalRes = SubdomainApproval | SubdomainApprovalError;

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

export interface PriceConversionRes {
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

export interface DomainFromHashRes {
  name: string;
  success: boolean;
}
