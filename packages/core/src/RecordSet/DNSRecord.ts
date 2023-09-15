import { Buffer } from 'buffer';

/**
 * DNS Record Types
 * @see https://en.wikipedia.org/wiki/List_of_DNS_record_types
 */
export type RecordType =
  | 'A'
  | 'AAAA'
  | 'AFSDB'
  | 'APL'
  | 'AXFR'
  | 'CAA'
  | 'CDNSKEY'
  | 'CDS'
  | 'CERT'
  | 'CNAME'
  | 'DNAME'
  | 'DHCID'
  | 'DLV'
  | 'DNSKEY'
  | 'DS'
  | 'HINFO'
  | 'HIP'
  | 'IXFR'
  | 'IPSECKEY'
  | 'KEY'
  | 'KX'
  | 'LOC'
  | 'MX'
  | 'NAPTR'
  | 'NS'
  | 'NSEC'
  | 'NSEC3'
  | 'NSEC3PARAM'
  | 'NULL'
  | 'OPT'
  | 'PTR'
  | 'RRSIG'
  | 'RP'
  | 'SIG'
  | 'SOA'
  | 'SRV'
  | 'SSHFP'
  | 'TA'
  | 'TKEY'
  | 'TLSA'
  | 'TSIG'
  | 'TXT'
  | 'URI';

export type RecordClass = 'IN' | 'CS' | 'CH' | 'HS' | 'ANY';
/**
 * DNS Record types
 * @see https://en.wikipedia.org/wiki/List_of_DNS_record_types
 */
export namespace Record {
  export interface Base {
    name: string;
    type: RecordType;
    class: RecordClass;
    ttl: number;
  }

  export interface A extends Base {
    type: 'A';
    /** IP Address */
    data: string;
  }

  export interface AAAA extends Base {
    type: 'AAAA';
    /** IPv6 Address */
    data: string; // fx fe80::1
  }

  export interface CNAME extends Base {
    type: 'CNAME';
    /** Canonical Name */
    data: string;
  }

  export interface MX extends Base {
    type: 'MX';
    data: {
      /** Mail server priority */
      preference: number;
      /** Mail server hostname */
      exchange: string;
    };
  }

  export interface TXT extends Base {
    type: 'TXT';
    /** Text record data */
    data: string | Buffer | Array<string | Buffer>;
  }
}

/**
 * DNS Record type. Currently, we focus on supporting most common types: A, AAAA, CNAME, MX, TXT
 */
export type DNSRecord = Record.A | Record.AAAA | Record.CNAME | Record.MX | Record.TXT;
