import { ethers, providers } from 'ethers';
import { hash as namehash } from '@ensdomains/eth-ens-namehash';
import DWEBName from './DWEBName';
import { DEFAULT_TTL } from './utils/contracts';
import { getContractConfig, getContract } from './contracts';
import { ContractConfig, EthNetwork } from './contracts/interfaces';
import { isValidDomain } from './utils/dns';

export type RegistryConfig = {
  network: EthNetwork;
  provider: providers.BaseProvider;
  signer?: ethers.Signer;
  contracts?: ContractConfig;
};

export default class DWEBRegistry {
  network: EthNetwork;
  provider: providers.BaseProvider;
  private readonly contract: ethers.Contract;
  readonly contractConfig: ContractConfig;
  signer?: ethers.Signer;

  constructor(options: RegistryConfig) {
    const { network, provider, signer } = options;
    this.provider = provider;
    this.signer = signer;
    this.network = network;
    this.contractConfig = options.contracts || getContractConfig(network);
    this.contract = getContract({
      address: this.contractConfig.DWEBRegistry,
      name: 'DWEBRegistry',
      provider: provider,
      network: this.network
    });
  }

  private getWritableContract() {
    if (!this.signer) {
      throw new Error(
        'DWEBRegistry is initialized in read-only mode. Provide signer to write data.'
      );
    }
    return getContract({
      address: this.contractConfig.DWEBRegistry,
      name: 'DWEBRegistry',
      provider: this.signer,
      network: this.network
    });
  }

  /**
   * Create instance of DWEBName to read/write data for specific domain name
   * @param name - domain name you would like to work with
   */
  name(name: string) {
    return new DWEBName({
      name,
      registry: this.contract,
      provider: this.provider,
      network: this.network,
      signer: this.signer
    });
  }

  async assignDefaultResolver(name: string): Promise<providers.TransactionResponse> {
    const contract = this.getWritableContract();
    const hash = namehash(name);
    return contract.setResolverAndTTL(hash, this.contractConfig.PublicResolver, DEFAULT_TTL);
  }

  async setResolver(name: string, address: string): Promise<providers.TransactionResponse> {
    const contract = this.getWritableContract();
    const hash = namehash(name);
    return contract.setResolver(hash, address);
  }

  async getReverseRecord(address: string, skipForwardCheck = false): Promise<string | null> {
    const reverseName = `${address.slice(2)}.addr.reverse`;
    const reverseHash = namehash(reverseName);
    const resolverAddr = await this.contract.resolver(reverseHash);
    if (parseInt(resolverAddr, 16) === 0) {
      return null;
    }
    const resolver = getContract({
      address: resolverAddr,
      name: 'DefaultReverseResolver',
      provider: this.provider,
      network: this.network
    });
    const domain = await resolver.name(reverseHash);
    if (!domain || !isValidDomain(domain)) {
      return null;
    }
    if (!skipForwardCheck) {
      const name = this.name(domain);
      const ethAddress = await name.getAddress('ETH');
      if (ethAddress !== address) {
        return null;
      }
    }
    return domain;
  }

  async setReverseRecord(name: string) {
    if (!this.signer) {
      throw new Error(
        'DWEBRegistry is initialized in read-only mode. Provide signer to write data.'
      );
    }
    const reverseRegistrar = getContract({
      address: this.contractConfig.ReverseRegistrar,
      name: 'ReverseRegistrar',
      provider: this.signer,
      network: this.network
    });
    return reverseRegistrar.setName(name);
  }
}
