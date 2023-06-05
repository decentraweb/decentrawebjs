import fetchPonyfill from 'fetch-ponyfill';
import { EthNetwork } from '../contracts/interfaces';
import {ethers} from "ethers";
import {randomBytes} from "crypto";

const { fetch } = fetchPonyfill();

interface ApproveRegistrationRequest {
  name: Array<string>;
  owner: string;
  secret: string;
  chainid: 1 | 5;
}

interface ApproveRegistrationSuccess {
  commitment: string;
  signature: string;
  timestamp: number;
}

interface ApproveRegistrationError {
  errorMessage: string;
  error: Array<{ errorCode: number; error: string }>;
}

type ApproveRegistrationResponse = ApproveRegistrationSuccess | ApproveRegistrationError;

export interface Approval {
  commitment: string,
  secret: string,
  signature: string,
  timestamp: number
}

class DecentrawebAPI {
  readonly network: EthNetwork;
  readonly baseUrl: string;
  readonly chainId: 1 | 5;

  constructor(network: EthNetwork) {
    this.network = network;
    switch (network) {
      case 'mainnet':
        this.baseUrl = 'https://api.decentraweb.org';
        this.chainId = 1;
        break;
      case 'goerli':
        this.baseUrl = 'https://dns-api-goerli.decentraweb.org';
        this.chainId = 5;
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  async get<R>(path: string, query: Record<string, string>): Promise<R> {
    const url = new URL(this.baseUrl);
    url.pathname = path;
    url.search = new URLSearchParams(query).toString();
    const response = await fetch(url.toString());
    return response.json();
  }

  async post<R>(path: string, query: Record<string, string>, data: any): Promise<R> {
    const url = new URL(this.baseUrl);
    url.pathname = path;
    url.search = new URLSearchParams(query).toString();
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async approveRegistration(owner: string, names: Array<string>): Promise<Approval> {
    const payload: ApproveRegistrationRequest = {
      name: names,
      owner: ethers.utils.getAddress(owner),
      chainid: this.chainId,
      secret: '0x' + randomBytes(32).toString('hex')
    };
    const result = await this.post<ApproveRegistrationResponse>(
      '/api/v1/approve-registration',
      {},
      payload
    );
    if ('errorMessage' in result) {
      let message = result.errorMessage;
      if(result?.error?.[0]?.error){
        message += `. ${result.error[0].error}.`
      }
      throw new Error(message);
    }
    return {
      commitment: result.commitment,
      secret: payload.secret,
      signature: result.signature,
      timestamp: result.timestamp
    };
  }
}

export default DecentrawebAPI;
