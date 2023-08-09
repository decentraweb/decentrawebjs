import { ChainId, EthNetwork } from '../contracts/interfaces';
import { getChainId } from '../utils/ethereum';
import fetchPonyfill from 'fetch-ponyfill';

const { fetch } = fetchPonyfill();

class ApiWrapper {
  readonly network: EthNetwork;
  readonly baseUrl: string;
  readonly chainId: ChainId;

  constructor(network: EthNetwork) {
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
}

export default ApiWrapper;
