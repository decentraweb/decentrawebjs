import { ethers, providers } from 'ethers';
import { formatsByName } from '@ensdomains/address-encoder';
import { PublicResolver as publicResolverContract } from '@ensdomains/ens-contracts';
import BaseDomain from '../BaseDomain';
import { RecordSet, RecordType, utils } from '@decentraweb/core';
import { dnsWireNameHash } from './utils';
import { ENSConfig } from '../../types';

export function getResolverContract(address: string, provider: providers.Provider) {
  return new ethers.Contract(address, publicResolverContract, provider);
}

export class ENSDomain extends BaseDomain {
  readonly provider = 'ens';
  readonly features = {
    address: true,
    contentHash: true,
    dns: true,
    txt: true
  };
  private resolver?: providers.Resolver | null;
  private config: ENSConfig;

  constructor(name: string, config: ENSConfig) {
    super(name);
    this.config = config;
  }

  async getResolver() {
    if (typeof this.resolver === 'undefined') {
      this.resolver = await this.config.provider.getResolver(this.name);
    }
    if (this.resolver === null) {
      throw new Error('ENS domain is not registered or has no resolver');
    }
    return this.resolver;
  }

  async address(coinId: string) {
    const resolver = await this.getResolver();
    const { coinType } = formatsByName[coinId];
    return resolver.getAddress(coinType);
  }

  async contentHash() {
    const resolver = await this.getResolver();
    return resolver.getContentHash();
  }

  async dns(recordType: RecordType) {
    const resolver = await this.getResolver();
    const contract = getResolverContract(resolver.address, this.config.provider);
    const data = await contract.dnsRecord(
      utils.hashName(this.name),
      dnsWireNameHash(this.name),
      RecordSet.recordType.toType(recordType)
    );
    const buf = Buffer.from(data.replace('0x', ''), 'hex');
    if (!buf.length) {
      return [];
    }
    return RecordSet.decode(buf);
  }

  async exists() {
    const resolver = await this.config.provider.getResolver(this.name);
    this.resolver = resolver;
    return resolver !== null;
  }

  async ttl() {
    return 0;
  }

  async txt(key: string): Promise<string | null> {
    const resolver = await this.getResolver();
    return resolver.getText(key);
  }
}

export default ENSDomain;
