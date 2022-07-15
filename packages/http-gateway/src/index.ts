import { providers } from 'ethers';
import http, { IncomingMessage, RequestOptions, ServerResponse } from 'http';
import axios from 'axios';
import { EthNetwork, DWEBRegistry, DWEBName, RecordSet } from '@decentraweb/core';
import {supportsHTTPS} from "./lib/utils";
import * as https from "https";
import resolveDNS, {DNSResult} from "./lib/resolveDNS";

interface Logger {
  log(...mesages: string[]): void;
}

function createLogger(): Logger {
  const messageStack: string[] = [];
  const startTime = new Date();
  let written = false;
  const logger = {
    log(...mesages: string[]) {
      console.log(`${Date.now() - startTime.getTime()}ms ${mesages}`);
    }
  };
  return logger;
}

const CACHE: Record<string, { address: string; proto: Protocol }> = {};

export interface GatewayOptions {
  baseDomain: string;
  provider: providers.BaseProvider;
  network: EthNetwork;
}

class Context {
  readonly req: IncomingMessage;
  readonly res: ServerResponse;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.req = req;
    this.res = res;
  }
}

type Protocol = 4 | 6;

export class HTTPGateway {
  readonly baseDomain: string;
  private server: http.Server;
  private dweb: DWEBRegistry;

  constructor(options: GatewayOptions) {
    this.baseDomain = options.baseDomain;
    this.server = http.createServer({});
    this.handleRequest = this.handleRequest.bind(this);
    this.server.on('request', this.handleRequest);
    this.dweb = new DWEBRegistry({ network: options.network, provider: options.provider });
  }

  listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, () => resolve());
    });
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const logger = createLogger();
    const ctx = new Context(req, res);
    console.log(req.headers.host);
    const hostname = req.headers.host?.split(':').shift() || '';
    console.log('hostname', hostname);
    if (!hostname.endsWith(this.baseDomain)) {
      return this.notFound(ctx);
    }
    logger.log('Parsed domain');
    const dwebName = hostname.slice(0, -1 - this.baseDomain.length);
    const name = this.dweb.name(dwebName);
    if (!(await name.hasResolver())) {
      return this.notFound(ctx);
    }
    logger.log('Has resolver');
    const dnsData = await resolveDNS(name);
    logger.log('Got server address');
    if (dnsData) {
      return this.proxyHTTP(ctx, dnsData);
    }
    console.log('DOMAIN', dwebName);
    res.write(dwebName);
    res.end();
  }

  notFound(ctx: Context) {
    ctx.res.statusCode = 404;
    ctx.res.write('Not found');
    ctx.res.end();
  }

  async proxyHTTP(ctx: Context, dnsData: DNSResult){
    const {req, res} = ctx;
    const {domain, address, protocol, isHTTPS} = dnsData;
    if(!address){

    }
    const url = `${isHTTPS ? 'https' : 'http'}://${domain}${req.url}`;
    const client = isHTTPS ? https : http;
    const options: RequestOptions = {
      method: req.method,
      headers: {
        ...req.headers,
        host: domain
      },
      lookup: (hostname, options, callback) => {
        console.log('LOOKUP', hostname, options);
        callback(null, address, protocol);
      }
    };
    client
      .request(url, options, (result) => {
        console.log('Got response');
        Object.entries(result.headers).forEach(([key, value]) => {
          if (value) {
            res.setHeader(key, value);
          }
        });
        res.statusCode = result.statusCode || 200;
        result.pipe(res);
        console.log('Piped');
      })
      .end();
  }

  async resolveDNS(name: DWEBName): Promise<{ address: string | null; proto: Protocol }> {
    if (CACHE[name.name]) {
      return CACHE[name.name];
    }
    let recordsRaw = await name.getDNS(RecordSet.recordType.toType('A'));
    let proto: Protocol = 4;
    if (!recordsRaw) {
      recordsRaw = await name.getDNS(RecordSet.recordType.toType('AAAA'));
      proto = 6;
    }
    if (!recordsRaw) {
      return { address: null, proto };
    }
    const records = RecordSet.decode(recordsRaw);
    const result = { address: records[0].data as string, proto };
    CACHE[name.name] = result;

    return result;
  }

}

export default HTTPGateway;
