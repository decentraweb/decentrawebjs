import { RecordType } from '@decentraweb/core';
import { DNSRecord } from '@decentraweb/core';
import { DomainProvider, ToolkitConfig } from '../types';

export abstract class BaseDomain {
  readonly name: string;
  abstract provider: DomainProvider;

  protected config: ToolkitConfig;

  constructor(name: string, config: ToolkitConfig) {
    this.name = name;
    this.config = config;
  }

  abstract address(coinId: string): Promise<string | null>;

  abstract contentHash(): Promise<string | null>;

  abstract dns(recordType: RecordType): Promise<DNSRecord[]>;

  abstract exists(): Promise<boolean>;

  abstract txt(key: string): Promise<string | null>;
}

export default BaseDomain;
