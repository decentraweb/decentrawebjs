
declare module '@ensdomains/ens-contracts';

declare module '@ensdomains/eth-ens-namehash' {
  function hash(name: string):string;
  function normalize(name: string): string;
}

/*declare module 'dns-packet' {
  import {Buffer} from "buffer";
  const name: {
    encode(str: string, buf?: Buffer, offset?: number): Buffer;
    decode(buf: Buffer, offset?: number): string;
  }
}*/
