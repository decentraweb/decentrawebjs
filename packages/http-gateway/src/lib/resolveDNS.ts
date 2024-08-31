import { supportsHTTPS } from './utils';
import Cache from './Cache';
import { DWEBDomain } from '@decentraweb/namekit';
import { StringAnswer } from 'dns-packet';

export interface DNSResult {
  domain: string;
  address: string;
  protocol: 4 | 6;
  isHTTPS: boolean;
}

const DNS_CACHE = new Cache<DNSResult | null>(5 * 60 * 1000);

interface Options {
  ipfsGatewayIp: string;
}

export async function resolveDNS(
  name: DWEBDomain,
  { ipfsGatewayIp }: Options
): Promise<DNSResult | null> {
  const cached = await DNS_CACHE.read(name.name);
  if (cached !== undefined) {
    return cached;
  }
  let recordsRaw = await name.dns('A');
  if (!recordsRaw) {
    recordsRaw = await name.dns('AAAA');
  }
  if (recordsRaw && recordsRaw.length) {
    const record = recordsRaw[0] as StringAnswer;
    const result: DNSResult = {
      domain: name.name,
      address: record.data,
      protocol: record.type === 'AAAA' ? 6 : 4,
      isHTTPS: await supportsHTTPS(record.data as string)
    };
    await DNS_CACHE.write(name.name, result, (record.ttl || 3600) * 1000);
    return result;
  }

  const url = await name.contentHash();
  if (url && /^\/?(ipfs|ipns)/.test(url)) {
    const result: DNSResult = {
      domain: name.name,
      address: ipfsGatewayIp,
      protocol: 4,
      isHTTPS: await supportsHTTPS(ipfsGatewayIp)
    };
    await DNS_CACHE.write(name.name, result);
    return result;
  }
  return null;
}

export default resolveDNS;
