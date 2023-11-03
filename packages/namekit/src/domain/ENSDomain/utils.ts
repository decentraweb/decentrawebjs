import { ethers } from 'ethers';

export function dnsWireName(domain: string): Buffer {
  const name = domain.replace(/^\.|\.$/gm, '');
  const byteLength = Buffer.byteLength(name) + 2;
  const buf = Buffer.alloc(byteLength);
  let offset = 0;

  // strip leading and trailing .
  const n = domain.replace(/^\.|\.$/gm, '');
  if (n.length) {
    const list = n.split('.');

    for (let i = 0; i < list.length; i++) {
      const len = buf.write(list[i], offset + 1);
      buf[offset] = len;
      offset += len + 1;
    }
  }

  buf[offset++] = 0;
  return buf;
}

export function dnsWireNameHash(domain: string): string {
  return ethers.utils.keccak256(dnsWireName(domain));
}
