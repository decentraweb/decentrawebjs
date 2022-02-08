import {Buffer} from "buffer";

export type RecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT";

export type RecordClass = "IN" | "CS" | "CH" | "HS" | "ANY";

export namespace Record {
  export interface Base {
    name: string;
    type: RecordType;
    class: RecordClass;
    ttl: number;
  }

  export interface A extends Base{
    type: 'A'
    /**
     * IP Address
     */
    data: string
  }

  export interface AAAA  extends Base {
    type: 'AAAA'
    data: string // fx fe80::1
  }

  export interface CNAME  extends Base{
    type: 'CNAME'
    data: string //'cname.to.another.record'
  }

  export interface MX  extends Base {
    type: 'MX'
    data: {
      preference: number,
      exchange: string
    }
  }

  export interface TXT extends Base {
    type: 'TXT'
    data: string | Buffer | Array<string | Buffer>;
  }
}




export type DNSRecord = Record.A | Record.AAAA | Record.CNAME | Record.MX | Record.TXT;
