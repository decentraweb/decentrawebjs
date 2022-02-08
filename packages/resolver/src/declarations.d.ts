
declare module '@ensdomains/ens-contracts';

declare module '@ensdomains/eth-ens-namehash' {
  function hash(name: string):string;
  function normalize(name: string): string;
}

declare module "dns2" {
  import EventEmitter from "events";
  import {Buffer} from "buffer";
  interface ServerOptions {
    doh?: number | boolean
    tcp?: number | boolean
    udp?: number | boolean
    handle?: (request: Packet, send: (response: Packet)=>Promise<Packet>, rinfo: any)=>void
  }

  export class DNSServer extends EventEmitter {
    constructor(options: ServerOptions)
    addresses(): string[]
    listen(ports: Record<'udp'|'tcp'|'doh', number>): Promise<string[]>
    close(): Promise<void>
  }

  export function createServer(options: ServerOptions): DNSServer
  class Answer {

  }
  class Packet {
    constructor()
    static parse(buffer: Buffer): Packet
    static createResponseFromRequest(request: Packet): Packet
    questions: Packet.Question[]
    answers: Packet.Resource[]
    authorities: Packet.Resource[]
    additionals: Packet.Resource[]
  }
  namespace Packet {
    class Writer {
      write(d: number, size: number): void
      toBuffer(): Buffer
    }
    class Reader {
      static read(buffer: Buffer, offset: number, length: number): number
      read(size: number): number
    }
    class Question {
      static decode(reader: Reader): Question
      static encode(question: Question, writer: Writer): Buffer
      name: string
      type: number
      class: number
      toBuffer(): Buffer
    }
    class Resource {
      static encode(resource: any, writer?: Writer): Buffer
      name: string
      type: number
      class: number
      ttl: number
      toBuffer(): Buffer
    }
  }
}

/*declare module 'dns-packet' {
  import {Buffer} from "buffer";
  const name: {
    encode(str: string, buf?: Buffer, offset?: number): Buffer;
    decode(buf: Buffer, offset?: number): string;
  }
}*/
