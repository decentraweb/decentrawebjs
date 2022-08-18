import BaseDomain from './BaseDomain';
import { DWEBName, DWEBRegistry, RecordSet } from '@decentraweb/core';
import { RecordType } from '@decentraweb/core';
import { toType } from '@decentraweb/core/build/RecordSet/type';
import { ToolkitConfig } from '../types';

export class DWEBDomain extends BaseDomain {
  readonly provider = 'dweb';
  private readonly dwebName: DWEBName;

  constructor(name: string, config: ToolkitConfig) {
    super(name, config);
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
    const recordsData = await this.dwebName.getDNS(toType(recordType));
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
