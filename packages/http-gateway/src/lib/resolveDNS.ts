import { DWEBName, RecordSet } from '@decentraweb/core';
import { supportsHTTPS } from './utils';
import Cache from './Cache';

export interface DNSResult {
  domain: string;
  address: string;
  protocol: 4 | 6;
  isHTTPS: boolean;
}

const DNS_CACHE = new Cache<DNSResult | null>(5 * 60 * 1000);

export async function resolveDNS(name: DWEBName): Promise<DNSResult | null> {
  const cached = await DNS_CACHE.read(name.namehash);
  if (cached !== undefined) {
    return cached;
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
  await DNS_CACHE.write(name.namehash, result, record.ttl * 1000);
  console.log('DNS', result);
  return result;
}

export default resolveDNS;
