import { ethers, providers } from 'ethers';
import { formatsByName } from '@ensdomains/address-encoder';
import { PublicResolver as publicResolverContract } from '@ensdomains/ens-contracts';
import { hash as namehash } from '@ensdomains/eth-ens-namehash';
import BaseDomain from '../BaseDomain';
import { RecordSet } from '@decentraweb/core';
import { RecordType } from '@decentraweb/core';
import { dnsWireNameHash } from './utils';

export function getResolverContract(address: string, provider: providers.Provider) {
  return new ethers.Contract(address, publicResolverContract, provider);
}

export class ENSDomain extends BaseDomain {
  readonly provider = 'ens';
  private resolver?: providers.Resolver | null;

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
      namehash(this.name),
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
