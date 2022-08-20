import { name } from 'dns-packet';
import { ethers } from 'ethers';
import { hash as namehash } from '@ensdomains/eth-ens-namehash';

export function dnsWireName(domain: string): Buffer {
  return name.encode(domain);
}

export function dnsWireNameHash(domain: string): string {
  return ethers.utils.keccak256(dnsWireName(domain));
}

export function isValidDomain(domain: string): boolean {
  let isValid = true;
  try {
    namehash(domain);
  } catch (e) {
    isValid = false;
  }
  return isValid;
}
