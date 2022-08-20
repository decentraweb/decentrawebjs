import Resolver, { ResolverConfig } from './Resolver';
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import ReadableStream = NodeJS.ReadableStream;
import { Buffer } from 'buffer';
import * as dnsPacket from 'dns-packet';
import { RecordSet } from '@decentraweb/core';
import { RecordType } from 'dns-packet';

function decodeBase64URL(str: string): string | undefined {
  let queryData = str.replace(/-/g, '+').replace(/_/g, '/');
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
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('end', () => resolve(Buffer.concat(chunks)));
  });
}

type CorsHandler = (origin: string) => boolean;

interface DOHConfig extends ResolverConfig {
  cors: true | string | CorsHandler;
}

class DOHResolver extends Resolver {
  private server: http.Server;
  readonly cors: true | string | CorsHandler;

  constructor(options: DOHConfig) {
    const { cors, ...resolverOptions } = options;
    super(resolverOptions);
    this.handleRequest = this.handleRequest.bind(this);
    this.cors = cors;
    this.server = http.createServer({
      /*key,
      cert*/
    });
    this.server.on('request', this.handleRequest);
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    try {
      const { url } = req;
      const { pathname } = new URL(url as string, 'http://unused/');
      switch (pathname) {
        case '/dns-query':
          await this.handleBinaryRequest(req, res);
          break;
        case '/resolve':
          await this.handleJSONRequest(req, res);
          break;
        default:
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.write('404 Not Found\n');
          res.end();
      }
    } catch (e) {
      console.log('Unexpected error', e);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.write('500 Unexpected error\n');
      res.end();
    }
  }

  async handleBinaryRequest(req: IncomingMessage, res: ServerResponse) {
    const { method, url, headers } = req;
    const { searchParams: query } = new URL(url as string, 'http://unused/');
    const { cors } = this;
    const contentType = headers.accept;
    if (contentType !== 'application/dns-message') {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.write('400 Bad Request: Illegal content type\n');
      res.end();
      return;
    }
    if (cors === true) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (typeof cors === 'string') {
      res.setHeader('Access-Control-Allow-Origin', cors);
      res.setHeader('Vary', 'Origin');
    } else if (typeof cors === 'function') {
      if (headers.origin) {
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
    res.writeHead(200, { 'Content-Type': 'application/dns-message' });
    res.end(response);
  }

  async handleJSONRequest(req: IncomingMessage, res: ServerResponse) {
    const { url } = req;
    const { searchParams: query } = new URL(url as string, 'http://unused/');
    const name = query.get('name');
    const recordTypeRaw = query.get('type') || '1';
    let recordTypeStr;
    if (!name) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.write('400 Bad Request: No name defined\n');
      res.end();
      return;
    }

    //If number is passed convert it to string
    if (/\d+/.test(recordTypeRaw)) {
      const typeCode = parseInt(recordTypeRaw);
      if (0 > typeCode || typeCode > 65535) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.write('400 Bad Request: Invalid record type\n');
        res.end();
        return;
      }
      recordTypeStr = RecordSet.recordType.toString(typeCode);
    } else {
      if (!RecordSet.recordType.toType(recordTypeRaw)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.write('400 Bad Request: Invalid record type\n');
        res.end();
        return;
      }
      recordTypeStr = recordTypeRaw.toUpperCase();
    }
    const dnsRequest = dnsPacket.encode({
      type: 'query',
      id: 0,
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [
        {
          type: recordTypeStr as RecordType,
          name
        }
      ]
    });
    const dnsResponse = await this.processRequest(dnsRequest);
    if (!dnsResponse) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.write('500 Unexpected error\n');
      res.end();
      return;
    }
    const data = dnsPacket.decode(dnsResponse);
    data.answers?.forEach((a) => {
      if (a.type === 'TXT') {
        a.data = a.data.toString('utf-8');
      }
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        provider: await this.toolkit.getDomainProvider(name),
        result: data
      })
    );
  }

  listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, () => resolve());
    });
  }
}

export default DOHResolver;
