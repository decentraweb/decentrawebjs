import BaseDomain, { DomainFeature } from './BaseDomain';
import { DWEBName, DWEBRegistry, RecordSet, RecordType } from '@decentraweb/core';
import { DwebConfig } from '../types';

export class DWEBDomain extends BaseDomain {
  readonly provider = 'dweb';
  readonly features: Record<DomainFeature, boolean>;
  private readonly dwebName: DWEBName;
  private config: DwebConfig;

  constructor(name: string, config: DwebConfig) {
    super(name);
    this.config = config;
    const dweb = new DWEBRegistry({ network: config.network, provider: config.provider });
    this.dwebName = dweb.name(name);
    const isMatic = this.config.network === 'matic' || this.config.network === 'maticmum';
    this.features = {
      address: true,
      contentHash: !isMatic,
      dns: !isMatic,
      txt: !isMatic
    };
  }

  address(coinId: string) {
    return this.dwebName.getAddress(coinId);
  }

  async contentHash() {
    if (!this.features.contentHash) {
      return null;
    }
    return this.dwebName.getContenthash();
  }

  async dns(recordType: RecordType) {
    if (!this.features.dns) {
      return [];
    }
    const recordsData = await this.dwebName.getDNS(RecordSet.recordType.toType(recordType));
    if (!recordsData || !recordsData.length) {
      return [];
    }
    return RecordSet.decode(recordsData);
  }

  exists() {
    return this.dwebName.hasResolver();
  }

  async txt(key: string): Promise<string | null> {
    if (!this.features.txt) {
      return null;
    }
    return this.dwebName.getText(key);
  }
}

export default DWEBDomain;
