import { RecordType } from '@decentraweb/core';
import { DomainProvider } from '../types';
import { Answer } from 'dns-packet';

type DomainFeature = 'address' | 'contentHash' | 'dns' | 'txt';

export abstract class BaseDomain {
  readonly name: string;
  abstract provider: DomainProvider;
  abstract features: Record<DomainFeature, boolean>;

  constructor(name: string) {
    this.name = name;
  }

  abstract address(coinId: string): Promise<string | null>;

  abstract contentHash(): Promise<string | null>;

  abstract dns(recordType: RecordType): Promise<Answer[]>;

  abstract exists(): Promise<boolean>;

  abstract txt(key: string): Promise<string | null>;
}

export default BaseDomain;
