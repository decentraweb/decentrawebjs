import {EthChainId, PolygonChainId} from "../../contracts/interfaces";

export interface PayloadBase {
  name: string[];
  label: string[];
  owner: string;
  chainid: number;
  sender: string;
  signature?: string; //Signature is required for self registration. Empty string for on-demand registration
}

export interface EthereumPayload extends PayloadBase {
  chainid: EthChainId;
  isfeeindwebtoken: 0 | 1;
}

export interface PolygonPayload extends PayloadBase {
  chainid: PolygonChainId;
  feeTokenAddress: string;
}

export type Payload = EthereumPayload | PolygonPayload;

export interface Approval {
  commitment: string; //Commitment value.
  signature: string; //Signature value. It is used in contract call
  expiry: number; //User has to complete within this timestamp. The duration is 30 min from the response generation timestamp
  names: string[]; //Array of parent domains
  labels: string[]; //Array of labels.
  fee: string[]; //Fee for SLD mint. It is the array of price that user has to pay for each sld
  domainowner: string[]; //tld owner to which the sld fee will be paid. There can be multiple different owner in single tx
}

export interface Error {
  error: string;
  errorMessage?: string;
}

export type Response = Approval | Error;
