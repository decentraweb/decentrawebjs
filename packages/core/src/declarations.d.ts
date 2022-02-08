
declare module '@ensdomains/ens-contracts';

declare module '@ensdomains/eth-ens-namehash' {
  function hash(name: string):string;
  function normalize(name: string): string;
}

declare module '@ensdomains/content-hash' {
  function decode(contentHash: string):string;
  function fromIpfs(ipfsHash: string): string;
  function fromSkylink(skylink: string): string;
  function fromSwarm(swarmHash: string): string;
  function fromArweave(arweave: string): string;
  function encode(codec: string, value: string): string;
  function getCodec(hash: string): string;
}

declare module 'dns-packet' {
  import {Buffer} from "buffer";
  const name: {
    encode(str: string, buf?: Buffer, offset?: number): Buffer;
    decode(buf: Buffer, offset?: number): string;
  }

  namespace answer {
    export function encode(records: Record<string, any>, buf?: Buffer, offset?: number): Buffer;
    export function decode(buf: Buffer, offset?: number): any;
    namespace decode {
      export const bytes: number
    }
  }
}
