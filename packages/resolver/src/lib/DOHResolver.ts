import Resolver, {ResolverConfig} from "./Resolver";
import http, {IncomingMessage, ServerResponse} from "http";
import {URL} from "url";
import ReadableStream = NodeJS.ReadableStream;
import {Buffer} from "buffer";

function decodeBase64URL(str: string): string | undefined {
  let queryData = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = queryData.length % 4;
  if (pad === 1) return;
  if (pad) {
    queryData += new Array(5 - pad).join('=');
  }
  return queryData;
}

function readStream(stream: ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let chunks: Buffer[] = [];
    stream
      .on('error', reject)
      .on('data', chunk => { chunks.push(chunk); })
      .on('end', () => resolve(Buffer.concat(chunks)));
  });
}

type CorsHandler = (origin: string) => boolean

interface DOHConfig extends ResolverConfig {
  cors: true | string | CorsHandler
}

class DOHResolver extends Resolver {
  private server: http.Server
  readonly cors: true | string | CorsHandler;

  constructor(options: DOHConfig) {
    const {cors, ...resolverOptions} = options;
    super(resolverOptions);
    this.handleRequest = this.handleRequest.bind(this)
    this.cors = cors;
    this.server = http.createServer({
      /*key,
      cert*/
    })
    this.server.on('request', this.handleRequest)
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse){
    const { method, url, headers } = req;
    const { pathname, searchParams: query } = new URL(url as string, 'http://unused/');
    const { cors } = this;
    if (cors === true) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (typeof cors === 'string') {
      res.setHeader('Access-Control-Allow-Origin', cors);
      res.setHeader('Vary', 'Origin');
    } else if (typeof cors === 'function') {
      if(headers.origin){
        const isAllowed = cors(headers.origin);
        res.setHeader('Access-Control-Allow-Origin', isAllowed ? headers.origin : 'false');
      } else {
        res.setHeader('Access-Control-Allow-Origin', 'false');
      }
      res.setHeader('Vary', 'Origin');
    }
    // We are only handling get and post as required by rfc
    if (method !== 'GET' && method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.write('405 Method not allowed\n');
      res.end();
      return;
    }
    // Check so the uri is correct
    if (pathname !== '/dns-query') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.write('404 Not Found\n');
      res.end();
      return;
    }
    // Make sure the requestee is requesting the correct content type
    const contentType = headers.accept;
    if (contentType !== 'application/dns-message') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.write('400 Bad Request: Illegal content type\n');
      res.end();
      return;
    }
    let queryData: Buffer;
    if (method === 'GET') {
      // Parse query string for the request data
      const dns = query.get('dns');
      if (!dns) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.write('400 Bad Request: No query defined\n');
        res.end();
        return;
      }
      // Decode from Base64Url Encoding
      const base64 = decodeBase64URL(dns);
      if (!base64) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.write('400 Bad Request: Invalid query data\n');
        res.end();
        return;
      }
      // Decode Base64 to buffer
      queryData = Buffer.from(base64, 'base64');
    } else {
      queryData = await readStream(req);
    }
    const response = await this.processRequest(queryData);
    res.writeHead(200, {'Content-Type': 'application/dns-message'});
    res.end(response);
  }

  listen(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(port, () => resolve())
    });
  }
}

export default DOHResolver;
