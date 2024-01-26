import { ChainId, Network } from '../types/common';
import { getChainId } from '../utils/ethereum';
import { accountDomainsPayload, AccountDomainsResponse } from './accountDomains';
import DecentrawebAPI from '../api';
import { AccountDomain } from './types';

export * from './types';

const PERMANENT_DOMAIN_EXPIRY = '9223372036854775807';

function microToDate(micro: number | string): Date {
  const microNumber = Number(micro);
  return new Date(Math.round(microNumber / 1000));
}

export class DecentrawebGraph {
  readonly network: Network;
  readonly grapnNetwork: 'eth' | 'matic';
  readonly baseUrl: string;
  readonly chainId: ChainId;

  constructor(network: Network) {
    this.network = network;
    this.chainId = getChainId(network);
    switch (network) {
      case 'mainnet':
        this.baseUrl = 'https://api.thegraph.com/subgraphs/name/decentra-web/decentraweb';
        this.grapnNetwork = 'eth';
        break;
      case 'matic':
        this.baseUrl = 'https://api.thegraph.com/subgraphs/name/decentra-web/decentrawebpolygon';
        this.grapnNetwork = 'matic';
        break;
      case 'goerli':
        this.baseUrl = 'https://api.thegraph.com/subgraphs/name/ic999/dwebsubgraphrinkeby1';
        this.grapnNetwork = 'eth';
        break;
      case 'maticmum':
        this.baseUrl = 'https://api.thegraph.com/subgraphs/name/ic999/dwebsubgraphmumbai1';
        this.grapnNetwork = 'matic';
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  private async query<R>(data: any): Promise<R> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  /**
   * Get all domains owned by address on current network
   * @param address - Ethereum address
   * @param skip
   * @param limit
   */
  async getOwnedDomains(address: string, skip: number, limit: number) {
    const payload = accountDomainsPayload(address, skip, limit, this.grapnNetwork);
    const res = await this.query<AccountDomainsResponse>(payload);
    const api = new DecentrawebAPI(this.network);
    const resolvedDomains = await Promise.all(
      res.data.account.domains.map(async (d) => {
        if (d.labelName) {
          return d;
        }
        const domain = await api.domainFromHash(d.name);
        if (!domain) {
          return d;
        }
        return {
          ...d,
          name: domain
        };
      })
    );

    return resolvedDomains.map((d) => ({
      name: d.name,
      isTLD: d.isTLD,
      createdAt: microToDate(d.timestamp),
      expiresAt: d.expiryDate === PERMANENT_DOMAIN_EXPIRY ? null : microToDate(d.expiryDate),
      renewalFee: d.renewalFee ? Number(d.renewalFee) : null
    }));
  }
}

export default DecentrawebGraph;
