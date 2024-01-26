import { BigNumber, ethers } from 'ethers';
import {
  DomainFromHashRes,
  EthSubdomainApprovalPayload,
  PolySubdomainApprovalPayload,
  PolyTLDCommitmentPayload,
  PolyTLDCommitmentRes,
  PolyTLDRegistrationRes,
  PriceConversionRes,
  PriceConversionResult,
  RequestPolyTLDRegistrationPayload,
  StakedDomain,
  SubdomainApproval,
  SubdomainApprovalPayload,
  SubdomainApprovalPayloadBase,
  SubdomainApprovalRes,
  SubmitPolyTLDRegistrationPayload,
  TLDApproval,
  TLDApprovalPayload,
  TLDApprovalRes
} from './types';
import { TypedData } from '../types/TypedData';
import getRandomHex from '../utils/getRandomHex';
import { getDwebAddress, getWethAddress } from '../contracts';
import { SubdomainEntry as SubdomainEntry } from '../registrars/types/Subdomain';
import { getChainId } from '../utils/ethereum';
import { ChainId, Network } from '../types/common';

export * from './types';

/**
 * Decentraweb API wrapper. This API is used during registration process. Usually you don't need to use it directly.
 */
export class DecentrawebAPI {
  readonly network: Network;
  readonly baseUrl: string;
  readonly chainId: ChainId;

  constructor(network: Network) {
    this.network = network;
    this.chainId = getChainId(network);
    switch (network) {
      case 'mainnet':
      case 'matic':
        this.baseUrl = 'https://api.decentraweb.org';
        break;
      case 'goerli':
      case 'maticmum':
        this.baseUrl = 'https://dns-api-goerli.decentraweb.org';
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  async approveTLDRegistration(owner: string, names: Array<string>): Promise<TLDApproval> {
    const payload: TLDApprovalPayload = {
      name: names,
      owner: ethers.utils.getAddress(owner),
      chainid: this.chainId,
      secret: '0x' + getRandomHex(32)
    };
    const result = await this.post<TLDApprovalRes>('/api/v1/approve-registration', {}, payload);
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
  ): Promise<{ payload: SubdomainApprovalPayload; typedData: TypedData }> {
    const payload = this.getSLDApprovalPayload(owner, entries, isFeesInDweb, sender);
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

  async approveSelfSLDRegistration(payload: SubdomainApprovalPayload): Promise<SubdomainApproval> {
    const res = await this.post<SubdomainApprovalRes>(
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
    owner: string,
    entries: Array<SubdomainEntry>,
    isFeesInDweb = false
  ): Promise<SubdomainApproval> {
    const payload = this.getSLDApprovalPayload(owner, entries, isFeesInDweb);
    const res = await this.post<SubdomainApprovalRes>(
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

  /**
   * Convert price from USD to ETH, DWEB, and MATIC
   * @param priceUSD - Price in USD
   */
  async convertPrice(priceUSD: number): Promise<PriceConversionResult> {
    const result = await this.convertPriceBatch([priceUSD]);
    return result[0];
  }

  /**
   * Convert multiple amounts from USD to ETH, DWEB, and MATIC
   * @param pricesUSD - array of prices in USD
   */
  async convertPriceBatch(pricesUSD: number[]): Promise<PriceConversionResult[]> {
    const payload = {
      price: pricesUSD,
      chainid: this.chainId
    };
    const res = await this.post<PriceConversionRes>('/api/v1/convert-price', {}, payload);
    return pricesUSD.map((price, i) => {
      return {
        usd: price,
        eth: BigNumber.from(res.eth[i]),
        dweb: BigNumber.from(res.dweb[i]),
        matic: res.matic ? BigNumber.from(res.matic[i]) : undefined
      };
    });
  }

  sendPolygonTLDCommitment(payload: PolyTLDCommitmentPayload): Promise<PolyTLDCommitmentRes> {
    return this.post<PolyTLDCommitmentRes>(
      '/api/v1/send-commitment-tx',
      {},
      {
        ...payload,
        chainid: this.chainId
      }
    );
  }

  requestPolygonTLDRegistration(payload: RequestPolyTLDRegistrationPayload): Promise<TypedData> {
    return this.post<TypedData>(
      '/api/v1/get-registration-tx',
      {},
      {
        ...payload,
        chainid: this.chainId
      }
    );
  }

  submitPolygonTLDRegistration(
    payload: SubmitPolyTLDRegistrationPayload
  ): Promise<PolyTLDRegistrationRes> {
    return this.post<PolyTLDRegistrationRes>(
      '/api/v1/send-registration-tx',
      {},
      {
        ...payload,
        chainid: this.chainId
      }
    );
  }

  async domainFromHash(hash: string): Promise<string | null> {
    const data = await this.get<DomainFromHashRes>(`/api/v1/domain-from-hash/${hash}`, {});
    return data.success ? data.name : null;
  }

  private async get<R>(path: string, query: Record<string, string>): Promise<R> {
    const url = new URL(this.baseUrl);
    url.pathname = path;
    url.search = new URLSearchParams(query).toString();
    const response = await fetch(url.toString());
    return response.json();
  }

  private async post<R>(path: string, query: Record<string, string>, data: any): Promise<R> {
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

  private getSLDApprovalPayload(
    owner: string,
    entries: Array<SubdomainEntry>,
    isFeesInDweb = false,
    sender = ''
  ): SubdomainApprovalPayload {
    const base: SubdomainApprovalPayloadBase = {
      name: entries.map((e) => e.name),
      label: entries.map((e) => e.label),
      owner: ethers.utils.getAddress(owner),
      chainid: this.chainId,
      sender: sender ? ethers.utils.getAddress(sender) : '',
      duration: entries.map((e) => e.duration || 0),
      renewalFee: entries.map((e) =>
        'renewalFee' in e && e.renewalFee ? e.renewalFee.toString() : '0'
      )
    };
    switch (this.network) {
      case 'matic':
      case 'maticmum':
        return {
          ...base,
          feeTokenAddress: isFeesInDweb
            ? getDwebAddress(this.network)
            : getWethAddress(this.network)
        } as PolySubdomainApprovalPayload;
      default:
        return {
          ...base,
          isFeeInDWEBToken: isFeesInDweb
        } as EthSubdomainApprovalPayload;
    }
  }
}

export default DecentrawebAPI;
