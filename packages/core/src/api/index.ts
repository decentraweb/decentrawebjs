import { ethers } from 'ethers';
import {
  DomainFromHashRes,
  PolyTLDCommitmentPayload,
  PolyTLDCommitmentRes,
  PolyTLDRegistrationRes,
  PriceConversionRes,
  PriceConversionResult,
  RequestPolyTLDRegistrationPayload,
  StakedDomain,
  SubdomainApproval,
  SubdomainApprovalPayload,
  SubdomainApprovalRes,
  SubmitPolyTLDRegistrationPayload,
  TLDApproval,
  TLDApprovalPayload,
  TLDApprovalRes
} from './types';
import { TypedData } from '../types/TypedData';
import getRandomHex from '../utils/getRandomHex';
import { SubdomainEntry as SubdomainEntry } from '../registrars/types/Subdomain';
import { getChainId } from '../utils/chains';
import { ChainId, Network, Token } from '../types/common';
import { getFeeTokenAddress, validateFeeToken, ZERO_ADDRESS } from '../tokens';
import { DwebApiError } from '../errors';

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
      case 'sepolia':
      case 'matic-amoy':
        this.baseUrl = 'https://dns-api-demo.decentraweb.org';
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  async approveTLDRegistration(
    owner: string,
    names: Array<string>,
    feeToken?: Token
  ): Promise<TLDApproval> {
    feeToken = validateFeeToken(this.network, feeToken);
    const payload: TLDApprovalPayload = {
      name: names,
      owner: ethers.getAddress(owner),
      chainid: this.chainId,
      secret: '0x' + getRandomHex(32),
      feeTokenAddress: getFeeTokenAddress(this.network, feeToken)
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
      timestamp: result.timestamp,
      feeToken,
      feeTokenAddress: payload.feeTokenAddress || ZERO_ADDRESS
    };
  }

  async requestSelfSLDRegistration(
    sender: string,
    owner: string,
    entries: Array<SubdomainEntry>,
    feeToken?: Token
  ): Promise<{ payload: SubdomainApprovalPayload; typedData: TypedData }> {
    const payload = this.getSLDApprovalPayload(owner, entries, feeToken, sender);
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
    feeToken?: Token
  ): Promise<SubdomainApproval> {
    const payload = this.getSLDApprovalPayload(owner, entries, feeToken);
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
        native: BigInt(res.native[i]),
        dweb: BigInt(res.dweb[i]),
        usdt: BigInt(res.usdt[i]),
        usdc: BigInt(res.usdc[i])
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
    if (!response.ok) {
      throw await DwebApiError.fromResponse(response);
    }
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
    if (!response.ok) {
      throw await DwebApiError.fromResponse(response);
    }
    return response.json();
  }

  private getSLDApprovalPayload(
    owner: string,
    entries: Array<SubdomainEntry>,
    feeToken?: Token,
    sender = ''
  ): SubdomainApprovalPayload {
    return {
      name: entries.map((e) => e.name),
      label: entries.map((e) => e.label),
      owner: ethers.getAddress(owner),
      chainid: this.chainId,
      sender: sender ? ethers.getAddress(sender) : '',
      duration: entries.map((e) => e.duration || 0),
      renewalFee: entries.map((e) =>
        'renewalFee' in e && e.renewalFee ? e.renewalFee.toString() : '0'
      ),
      feeTokenAddress: getFeeTokenAddress(this.network, feeToken)
    };
  }
}

export default DecentrawebAPI;
