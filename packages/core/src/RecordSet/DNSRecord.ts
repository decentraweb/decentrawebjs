import { StringAnswer, MxAnswer, TxtAnswer } from 'dns-packet';

export type { Answer as DNSRecord, RecordType, RecordClass } from 'dns-packet';

/**
 * DNS Record types
 * @see https://en.wikipedia.org/wiki/List_of_DNS_record_types
 */
export namespace DNSRecord {
  export type A = StringAnswer;
  export type AAAA = StringAnswer;
  export type CNAME = StringAnswer;
  export type DNAME = StringAnswer;
  export type NS = StringAnswer;
  export type PTR = StringAnswer;
  export type MX = MxAnswer;
  export type TXT = TxtAnswer;
}
