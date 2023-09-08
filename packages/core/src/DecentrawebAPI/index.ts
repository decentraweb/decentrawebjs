import { BigNumber, ethers } from 'ethers';
import {
  PriceConversionResponse,
  PriceConversionResult,
  StakedDomain,
  TLDApproval,
  TLDApprovalPayload,
  TLDApprovalResponse
} from './types';
import * as ISubdomainApproval from './types/SubdomainApproval';
import { TypedData } from '../types/TypedData';
import getRandomHex from '../utils/getRandomHex';
import ApiWrapper from './ApiWrapper';
import { getDwebAddress, getWethAddress } from '../contracts';
import { Entry as SubdomainEntry } from '../registrars/types/Subdomain';
import {
  RegistrationResponse,
  RequestRegistrationPayload,
  RequestRegistrationResponse,
  SendCommitmentPayload,
  SendCommitmentResponse,
  SubmitRegistrationPayload
} from './types/PolygonTLD';

class DecentrawebAPI extends ApiWrapper {
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
  ): Promise<{ payload: ISubdomainApproval.Payload; typedData: TypedData }> {
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

  async approveSelfSLDRegistration(
    payload: ISubdomainApproval.Payload
  ): Promise<ISubdomainApproval.Approval> {
    const res = await this.post<ISubdomainApproval.Response>(
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
  ): Promise<ISubdomainApproval.Approval> {
    const payload = this.getSLDApprovalPayload(owner, entries, isFeesInDweb);
    const res = await this.post<ISubdomainApproval.Response>(
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

  async convertPrice(priceUSD: number): Promise<PriceConversionResult> {
    const result = await this.convertPriceBatch([priceUSD]);
    return result[0];
  }

  async convertPriceBatch(pricesUSD: number[]): Promise<PriceConversionResult[]> {
    const payload = {
      price: pricesUSD,
      chainid: this.chainId
    };
    const res = await this.post<PriceConversionResponse>('/api/v1/convert-price', {}, payload);
    return pricesUSD.map((price, i) => {
      return {
        usd: price,
        eth: BigNumber.from(res.eth[i]),
        dweb: BigNumber.from(res.dweb[i]),
        matic: res.matic ? BigNumber.from(res.matic[i]) : undefined
      };
    });
  }

  sendPolygonTLDCommitment(payload: SendCommitmentPayload): Promise<SendCommitmentResponse> {
    return this.post<SendCommitmentResponse>(
      '/api/v1/send-commitment-tx',
      {},
      {
        ...payload,
        chainid: this.chainId
      }
    );
  }

  requestPolygonTLDRegistration(
    payload: RequestRegistrationPayload
  ): Promise<RequestRegistrationResponse> {
    return this.post<RequestRegistrationResponse>(
      '/api/v1/get-registration-tx',
      {},
      {
        ...payload,
        chainid: this.chainId
      }
    );
  }

  submitPolygonTLDRegistration(payload: SubmitRegistrationPayload): Promise<RegistrationResponse> {
    return this.post<RegistrationResponse>(
      '/api/v1/send-registration-tx',
      {},
      {
        ...payload,
        chainid: this.chainId
      }
    );
  }

  private getSLDApprovalPayload(
    owner: string,
    entries: Array<SubdomainEntry>,
    isFeesInDweb = false,
    sender = ''
  ): ISubdomainApproval.Payload {
    const base: ISubdomainApproval.PayloadBase = {
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
        } as ISubdomainApproval.PolygonPayload;
      default:
        return {
          ...base,
          isFeeInDWEBToken: isFeesInDweb
        } as ISubdomainApproval.EthereumPayload;
    }
  }
}

export default DecentrawebAPI;
