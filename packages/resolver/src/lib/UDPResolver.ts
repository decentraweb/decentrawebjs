import dgram from 'dgram';
import {Buffer} from "buffer";
import Resolver, {ResolverConfig} from "./Resolver";

interface RInfo {
  address: string //The sender address.
  family: string //The address family ('IPv4' or 'IPv6').
  port: number //The sender port.
  size: number //The message size.
}

function isReverseLookup(domain: string): boolean {
  return domain.replace(/\.$/, "").endsWith('in-addr.arpa')
}

declare interface UDPResolver {
  on(event: 'request', handler: (request: string) => void): this;
}

class UDPServer extends Resolver {
  private readonly socket: dgram.Socket;

  constructor(options: ResolverConfig) {
    super(options);
    this.socket = dgram.createSocket("udp4")
    this.handle = this.handle.bind(this)
    this.socket.on('message', this.handle);
  }

  async handle(data: Buffer, rinfo: RInfo) {
    const response = await this.processRequest(data);
    if(!response){
      return;
    }
    this.socket.send(
      response,
      rinfo.port,
      rinfo.address,
      (err) => {
        if(err){
          console.log('Failed to send response')
          console.log(err)
        }
      }
    );
  }

  listen(port: number, address?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.bind(port, address, () => resolve())
    });
  }
}

export default UDPServer;
