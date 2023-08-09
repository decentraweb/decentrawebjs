import { PolygonChainId } from '../../contracts/interfaces';
import { TypedData } from '../../types/TypedData';

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

export interface RequestRegistrationPayload {
  name: string[];
  duration: number[];
  secret: string;
  owner: string;
  timestamp: number;
  feeTokenAddress: string;
  fee: string;
}

export type RequestRegistrationResponse = TypedData;

export interface SubmitRegistrationPayload extends RequestRegistrationPayload {
  signature: string;
}

export interface RegistrationResponse {
  txid: string;
}
