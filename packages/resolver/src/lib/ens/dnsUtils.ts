//@ts-ignore
import {name} from "dns-packet";
import {ethers} from "ethers";

export function dnsWireName(domain: string): Buffer {
  return name.encode(domain)
}

export function dnsWireNameHash(domain: string): string {
  return ethers.utils.keccak256(dnsWireName(domain))
}
