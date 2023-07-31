import { PolygonChainId } from '../contracts/interfaces';
import { TypedData } from '../types/TypedData';

export interface SendCommitmentPayload {
  name: string[];
  secret: string;
  signature: string;
  owner: string;
}

export interface SendCommitmentResponse {
  txid: string;
  commitment: string;
  chainId: PolygonChainId;
  timestamp: number;
}

export interface RequestTLDRegistrationPayload {
  name: string[];
  duration: number[];
  secret: string;
  owner: string;
  timestamp: number;
  feeTokenAddress: string;
  fee: string;
}

export type RequestTLDRegistrationResponse = TypedData;

export interface SubmitTLDRegistrationPayload extends RequestTLDRegistrationPayload {
  signature: string;
}

export interface SubmitTLDRegistrationResponse {
  txid: string;
}
