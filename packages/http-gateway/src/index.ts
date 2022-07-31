import {providers} from 'ethers';
import http, {IncomingMessage, RequestOptions, ServerResponse} from 'http';
import {DWEBRegistry, EthNetwork} from '@decentraweb/core';
import * as https from 'https';
import resolveDNS, {DNSResult} from './lib/resolveDNS';
import {hasResolver} from './lib/hasResolver';

interface Logger {
  (...mesages: string[]): void;
}

function createLogger(): Logger {
  const startTime = Date.now();
  let lastCall = startTime;
  return (...mesages: string[]) => {
    const now = Date.now();
    console.log(`${now - startTime}ms (${now - lastCall}ms)${mesages}`);
    lastCall = now;
  };
}

export interface GatewayOptions {
  baseDomain: string;
  provider: providers.BaseProvider;
  network: EthNetwork;
  ipfsGatewayIp: string;
}

class Context {
  readonly req: IncomingMessage;
  readonly res: ServerResponse;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.req = req;
    this.res = res;
  }
}

export class HTTPGateway {
  readonly baseDomain: string;
  readonly ipfsGatewayIp: string;
  private server: http.Server;
  private dweb: DWEBRegistry;

  constructor(options: GatewayOptions) {
    this.baseDomain = options.baseDomain;
    this.ipfsGatewayIp = options.ipfsGatewayIp;
    this.server = http.createServer({});
    this.handleRequest = this.handleRequest.bind(this);
    this.server.on('request', this.handleRequest);
    this.dweb = new DWEBRegistry({network: options.network, provider: options.provider});
  }

  listen(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(port, () => resolve());
    });
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const ctx = new Context(req, res);
    const hostname = req.headers.host?.split(':').shift() || '';
    if (!hostname.endsWith(this.baseDomain)) {
      return this.notFound(ctx);
    }
    const dwebName = hostname.slice(0, -1 - this.baseDomain.length);
    const name = this.dweb.name(dwebName);
    if (!(await hasResolver(name))) {
      return this.notFound(ctx);
    }
    const dnsData = await resolveDNS(name, {ipfsGatewayIp: this.ipfsGatewayIp});
    if (dnsData) {
      return this.proxyHTTP(ctx, dnsData);
    }
    return this.notFound(ctx);
  }

  notFound(ctx: Context) {
    ctx.res.statusCode = 404;
    ctx.res.write('Not found');
    ctx.res.end();
  }

  async proxyHTTP(ctx: Context, dnsData: DNSResult) {
    const {req, res} = ctx;
    const {domain, address, protocol, isHTTPS} = dnsData;
    if (!address) {
      return this.notFound(ctx);
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
        callback(null, address, protocol);
      }
    };
    const handleResult = (result: IncomingMessage) => {
      Object.entries(result.headers).forEach(([key, value]) => {
        if (value) {
          res.setHeader(key, value);
        }
      });
      res.statusCode = result.statusCode || 200;
      result.pipe(res);
    };
    const remoteReq = client.request(url, options, handleResult);
    req.pipe(remoteReq);
  }
}

export default HTTPGateway;
