import { providers } from 'ethers';
import Greenlock from 'greenlock';
import path from 'path';
import http, { IncomingMessage, RequestOptions, ServerResponse } from 'http';
import { DWEBName, DWEBRegistry, EthNetwork } from '@decentraweb/core';
import * as https from 'https';
import resolveDNS, { DNSResult } from './lib/resolveDNS';
import { hasResolver } from './lib/hasResolver';
import { createSecureContext, SecureContext } from 'tls';

export interface GatewayOptions {
  baseDomain: string;
  provider: providers.BaseProvider;
  network: EthNetwork;
  ipfsGatewayIp: string;
  certs: {
    maintainerEmail: string;
    storageDir: string;
  };
}

class Context {
  readonly req: IncomingMessage;
  readonly res: ServerResponse;
  readonly hostname: string;

  constructor(req: IncomingMessage, res: ServerResponse) {
    this.req = req;
    this.res = res;
    this.hostname = req.headers.host?.split(':').shift() || '';
  }
}

export class HTTPGateway {
  readonly baseDomain: string;
  readonly ipfsGatewayIp: string;
  private httpServer: http.Server;
  private httpsServer: https.Server;
  private dweb: DWEBRegistry;
  private greenlock: Greenlock.Greenlock;

  constructor(options: GatewayOptions) {
    this.baseDomain = options.baseDomain;
    this.ipfsGatewayIp = options.ipfsGatewayIp;
    this.httpServer = http.createServer({});
    this.httpsServer = https.createServer({
      SNICallback: (name, cb) => {
        this.handleSNI(name)
          .then((ctx) => cb(null, ctx))
          .catch((e) => {
            console.log('SNI ERR', e);
            cb(e);
          });
      }
    });
    this.httpServer.on('request', this.handleRequest);
    this.httpsServer.on('request', this.handleRequest);
    this.dweb = new DWEBRegistry({ network: options.network, provider: options.provider });
    this.greenlock = Greenlock.create({
      packageRoot: process.cwd(),
      configDir: options.certs.storageDir,
      packageAgent: `dweb-gateway/${options.baseDomain}`,
      maintainerEmail: options.certs.maintainerEmail,
      challenges: {
        'http-01': {
          module: 'acme-http-01-webroot',
          webroot: path.join(options.certs.storageDir, 'challenges')
        }
      }
    });
  }

  async listenHttps(port: number): Promise<number> {
    await this.greenlock.manager.defaults({
      agreeToTerms: true
    });
    return new Promise((resolve) => {
      this.httpsServer.listen(port, () => resolve(port));
    });
  }

  listenHttp(port: number): Promise<number> {
    return new Promise((resolve) => {
      this.httpServer.listen(port, () => resolve(port));
    });
  }

  handleSNI = async (name: string): Promise<SecureContext | undefined> => {
    const dwebName = await this.getDwebName(name);
    if (!dwebName) {
      return;
    }
    let site = await this.greenlock.get({ servername: name });
    if (!site) {
      const result = await this.greenlock.add({
        subject: name,
        altnames: [name]
      });
      console.log('Add', result);
      site = await this.greenlock.get({ servername: name });
    }
    return createSecureContext({
      cert: site.pems.cert,
      key: site.pems.privkey
    });
  };

  handleAcmeChallenge = async (ctx: Context) => {
    const { hostname, req, res } = ctx;
    const token = req.url?.split('/').pop() || '';
    const result = await this.greenlock.challenges.get({
      servername: hostname,
      token
    });
    if (result) {
      res.statusCode = 200;
      res.write(result.keyAuthorization);
    } else {
      res.statusCode = 404;
      res.write('Not found');
    }
    res.end();
  };

  handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
    const ctx = new Context(req, res);
    const name = await this.getDwebName(ctx.hostname);
    if (!name) {
      return this.notFound(ctx);
    }
    if (req.url?.startsWith('/.well-known/acme-challenge/')) {
      return this.handleAcmeChallenge(ctx);
    }
    const dnsData = await resolveDNS(name, { ipfsGatewayIp: this.ipfsGatewayIp });
    if (dnsData) {
      return this.proxyHTTP(ctx, dnsData);
    }
    return this.notFound(ctx);
  };

  async getDwebName(domain: string): Promise<DWEBName | null> {
    if (!domain.endsWith(this.baseDomain)) {
      return null;
    }
    const dwebName = domain.slice(0, -1 - this.baseDomain.length);
    const name = this.dweb.name(dwebName);
    return (await hasResolver(name)) ? name : null;
  }

  notFound(ctx: Context) {
    ctx.res.statusCode = 404;
    ctx.res.write('Not found');
    ctx.res.end();
  }

  async proxyHTTP(ctx: Context, dnsData: DNSResult) {
    const { req, res } = ctx;
    const { domain, address, protocol, isHTTPS } = dnsData;
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
