import Resolver, {ResolverConfig} from "./Resolver";
import net from 'net';
import {Buffer} from "buffer";

class TCPResolver extends Resolver {
  private server: net.Server;
  constructor(options: ResolverConfig) {
    super(options);
    this.server = net.createServer();
    this.handle = this.handle.bind(this)
    this.server.on('connection', this.handle);
  }

  listen(port: number, address?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, address, () => resolve())
    });
  }

  async handle(client: net.Socket) {
    const data = await this.readRequestStream(client);
    if(!data.length){
      return client.end();
    }
    const response = await this.processRequest(data);
    if(!response){
      return client.end();
    }
    const len = Buffer.alloc(2);
    len.writeUInt16BE(response.length);
    client.end(Buffer.concat([ len, response ]));
  }

  private readRequestStream(socket: net.Socket): Promise<Buffer> {
    let chunks: Buffer[]= [];
    let chunklen = 0;
    let received = false;
    let expected = 0;
    return new Promise((resolve, reject) => {
      const processMessage = () => {
        if (received) return;
        received = true;
        const buffer = Buffer.concat(chunks, chunklen);
        resolve(buffer.slice(2));
      };
      socket.on('end', processMessage);
      socket.on('error', reject);
      socket.on('readable', () => {
        let chunk;
        while ((chunk = socket.read()) !== null) {
          chunks.push(chunk);
          chunklen += chunk.length;
        }
        if (!expected && chunklen >= 2) {
          if (chunks.length > 1) {
            chunks = [ Buffer.concat(chunks, chunklen) ];
          }
          expected = chunks[0].readUInt16BE(0);
        }

        if (chunklen >= 2 + expected) {
          processMessage();
        }
      });
    });
  }

}

export default TCPResolver;
