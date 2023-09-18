import BaseDomain from './BaseDomain';
import { DWEBName, DWEBRegistry, RecordSet, RecordType } from '@decentraweb/core';
import { ToolkitConfig } from '../types';

export class DWEBDomain extends BaseDomain {
  readonly provider = 'dweb';
  readonly features = {
    address: true,
    contentHash: true,
    dns: true,
    txt: true
  };
  private readonly dwebName: DWEBName;
  private config: ToolkitConfig;

  constructor(name: string, config: ToolkitConfig) {
    super(name);
    this.config = config;
    const dweb = new DWEBRegistry({ network: config.network, provider: config.provider });
    this.dwebName = dweb.name(name);
  }

  address(coinId: string) {
    return this.dwebName.getAddress(coinId);
  }

  contentHash() {
    return this.dwebName.getContenthash();
  }

  async dns(recordType: RecordType) {
    const recordsData = await this.dwebName.getDNS(RecordSet.recordType.toType(recordType));
    if (!recordsData || !recordsData.length) {
      return [];
    }
    return RecordSet.decode(recordsData);
  }

  exists() {
    return this.dwebName.hasResolver();
  }

  txt(key: string): Promise<string | null> {
    return this.dwebName.getText(key);
  }
}

export default DWEBDomain;
