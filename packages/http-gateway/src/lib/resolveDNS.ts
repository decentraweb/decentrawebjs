import { DWEBName, RecordSet } from '@decentraweb/core';
import { supportsHTTPS } from './utils';

export interface DNSResult {
  domain: string;
  address: string;
  protocol: 4 | 6;
  isHTTPS: boolean;
}

const CACHE: Record<string, DNSResult> = {};

export async function resolveDNS(name: DWEBName): Promise<DNSResult | null> {
  if (CACHE[name.namehash]) {
    console.log('Use cached value');
    return CACHE[name.namehash];
  }
  let recordsRaw = await name.getDNS(RecordSet.recordType.toType('A'));
  if (!recordsRaw) {
    recordsRaw = await name.getDNS(RecordSet.recordType.toType('AAAA'));
  }
  if (!recordsRaw) {
    return null;
  }
  const records = RecordSet.decode(recordsRaw);
  const record = records[0];
  const result: DNSResult = {
    domain: name.name,
    address: record.data as string,
    protocol: record.type === 'AAAA' ? 6 : 4,
    isHTTPS: await supportsHTTPS(record.data as string)
  };
  CACHE[name.namehash] = result;
  return result;
}

export default resolveDNS;
