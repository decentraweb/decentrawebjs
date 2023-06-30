import fetchPonyfill from 'fetch-ponyfill';
import { ChainId, EthNetwork } from '../contracts/interfaces';
import { ethers } from 'ethers';
import {
  PriceConversionResponse,
  SLDApproval,
  SLDApprovalPayload,
  SLDApprovalResponse,
  StakedDomain,
  SubdomainEntry,
  TLDApproval,
  TLDApprovalPayload,
  TLDApprovalResponse
} from './types';
import { TypedData } from '../types/TypedData';
import getRandomHex from '../utils/getRandomHex';
import { getChainId } from '../utils/ethereum';

const { fetch } = fetchPonyfill();

class DecentrawebAPI {
  readonly network: EthNetwork;
  readonly baseUrl: string;
  readonly chainId: ChainId;

  constructor(network: EthNetwork) {
    this.network = network;
    this.chainId = getChainId(network);
    switch (network) {
      case 'mainnet':
        this.baseUrl = 'https://api.decentraweb.org';
        break;
      case 'goerli':
        this.baseUrl = 'https://dns-api-goerli.decentraweb.org';
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

  async approveTLDRegistration(owner: string, names: Array<string>): Promise<TLDApproval> {
    const payload: TLDApprovalPayload = {
      name: names,
      owner: ethers.utils.getAddress(owner),
      chainid: this.chainId,
      secret: '0x' + getRandomHex(32)
    };
    const result = await this.post<TLDApprovalResponse>(
      '/api/v1/approve-registration',
      {},
      payload
    );
    if ('errorMessage' in result) {
      let message = result.errorMessage;
      if (result?.error?.[0]?.error) {
        message += `. ${result.error[0].error}.`;
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

  async requestSelfSLDRegistration(
    sender: string,
    owner: string,
    entries: Array<SubdomainEntry>,
    isFeesInDweb = false
  ): Promise<{ payload: SLDApprovalPayload; typedData: TypedData }> {
    const payload: SLDApprovalPayload = {
      name: entries.map((e) => e.name),
      label: entries.map((e) => e.label),
      owner: ethers.utils.getAddress(owner),
      chainid: this.chainId,
      sender: ethers.utils.getAddress(sender),
      isfeeindwebtoken: isFeesInDweb ? 1 : 0
    };
    const typedData = await this.post<TypedData>(
      '/api/v1/get-approve-subdomain-registration',
      {},
      payload
    );
    return {
      payload: payload,
      typedData: typedData
    };
  }

  async approveSelfSLDRegistration(payload: SLDApprovalPayload): Promise<SLDApproval> {
    const res = await this.post<SLDApprovalResponse>(
      '/api/v1/approve-subdomain-registration',
      {},
      payload
    );
    if ('error' in res) {
      throw new Error(res.errorMessage || res.error);
    }
    return res;
  }

  async approveSLDRegistration(
    sender: string,
    owner: string,
    entries: Array<SubdomainEntry>,
    isFeesInDweb = false
  ): Promise<SLDApproval> {
    const payload: SLDApprovalPayload = {
      name: entries.map((e) => e.name),
      label: entries.map((e) => e.label),
      owner: ethers.utils.getAddress(owner),
      chainid: this.chainId,
      sender: ethers.utils.getAddress(sender),
      isfeeindwebtoken: isFeesInDweb ? 1 : 0,
      signature: ''
    };
    const res = await this.post<SLDApprovalResponse>(
      '/api/v1/approve-subdomain-registration',
      {},
      payload
    );
    if ('error' in res) {
      throw new Error(res.errorMessage || res.error);
    }
    return res;
  }

  async getStakedDomains(domains: Array<string>) {
    const payload = {
      names: domains
    };
    return this.post<Array<StakedDomain>>('/api/v1/get-stake-domains', {}, payload);
  }

  async convertPrice(priceUSD: number): Promise<PriceConversionResponse> {
    const payload = {
      price: priceUSD,
      chainid: this.chainId
    };
    return this.post<PriceConversionResponse>('/api/v1/convert-price', {}, payload);
  }
}

export default DecentrawebAPI;
