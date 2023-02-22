import * as Sentry from '@sentry/node';
import { providers } from 'ethers';
import Greenlock from 'greenlock';
import path from 'path';
import http, { IncomingMessage, RequestOptions, ServerResponse } from 'http';
import { DWEBName, DWEBRegistry, EthNetwork } from '@decentraweb/core';
import * as https from 'https';
import resolveDNS, { DNSResult } from './lib/resolveDNS';
import { hasResolver } from './lib/hasResolver';
import { createSecureContext, SecureContext } from 'tls';
import {errorPage} from "./lib/errorPage";

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
        const transaction = Sentry.startTransaction({
          name: 'SNI Callback',
          data: { domain: name }
        });
        this.handleSNI(name)
          .then((ctx) => {
            cb(null, ctx);
            transaction.setStatus('ok');
          })
          .catch((e) => {
            Sentry.captureException(e);
            cb(null);
            transaction.setStatus('unknown_error');
          })
          .then(() => transaction.finish());
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
    let site = await this.greenlock.get({ servername: name });
    if (!site) {
      const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
      const span = transaction?.startChild({ op: 'Issue certificate' });
      try {
        await this.greenlock.add({
          subject: name,
          altnames: [name]
        });
        span?.setStatus('ok');
      } catch (err) {
        span?.setStatus('unknown_error');
        throw err;
      } finally {
        span?.finish();
      }
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

  handleRequest = (req: IncomingMessage, res: ServerResponse): void => {
    const transaction = Sentry.startTransaction({
      name: 'Proxied request'
    });
    Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction));
    res.on('close', () => {
      transaction.finish();
    });
    const ctx = new Context(req, res);
    this._handleRequest(ctx)
      .then(() => {
        transaction.setStatus('ok');
      })
      .catch((e) => {
        console.error(e);
        Sentry.captureException(e);
        transaction?.setStatus('unknown_error');
        this.showError(ctx);
      });
  };

  _handleRequest = async (ctx: Context): Promise<void> => {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    const isAcmeChallenge = ctx.req.url?.startsWith('/.well-known/acme-challenge/');
    if (isAcmeChallenge) {
      transaction?.setName('ACME Challenge');
      transaction?.setData('domain', ctx.hostname);
      return this.handleAcmeChallenge(ctx);
    }
    if(ctx.hostname === this.baseDomain) {
      return this.homePage(ctx);
    }
    const name = await this.getDwebName(ctx.hostname);
    if (!name) {
      return this.domainNotFound(ctx);
    }
    const dnsData = await resolveDNS(name, { ipfsGatewayIp: this.ipfsGatewayIp });
    if (dnsData) {
      return this.proxyHTTP(ctx, dnsData);
    }
    return this.noContent(ctx);
  };

  async getDwebName(domain: string): Promise<DWEBName | null> {
    if (!domain.endsWith(this.baseDomain)) {
      return null;
    }
    const dwebName = domain.slice(0, -1 - this.baseDomain.length);
    const name = this.dweb.name(dwebName);
    return (await hasResolver(name)) ? name : null;
  }

  homePage(ctx: Context) {
    ctx.res.statusCode = 200;
    ctx.res.write(errorPage(
      'Web2 Bridge',
      `
        <p>This service allow you to access Decentraweb domains with regular browser.
         More details <a href="https://docs.decentraweb.org/welcome/publishing/using-the-dwebs.to-web2-bridge">here</a>.</p>
      `
    ));
    ctx.res.end();
  }

  domainNotFound(ctx: Context) {
    const dwebName = ctx.hostname.slice(0, -1 - this.baseDomain.length);
    ctx.res.statusCode = 404;
    ctx.res.write(errorPage(
      'Name not registered',
      `
        <p>The domain name "${dwebName}" is not registered in Decentraweb system.</p>
        <p>You can check and register it <a href="https://dns.decentraweb.org/search/${dwebName}">here</a>.</p>
      `
    ));
    ctx.res.end();
  }

  noContent(ctx: Context) {
    const dwebName = ctx.hostname.slice(0, -1 - this.baseDomain.length);
    ctx.res.statusCode = 404;
    ctx.res.write(errorPage(
      'No content',
      `
        <p>The domain name "${dwebName}" has no IPFS or DNS records set.</p>
        <p>If you are the owner, you can set IPFS hash or DNS records <a href="https://dns.decentraweb.org/name/${dwebName}">here</a>.</p>
      `
    ));
    ctx.res.end();
  }

  showError(ctx: Context) {
    ctx.res.statusCode = 500;
    ctx.res.write(errorPage(
      'Unexpected error',
      `
        <p>Something went wrong. Please try again later</p>
      `
    ));
    ctx.res.end();
  }

  async proxyHTTP(ctx: Context, dnsData: DNSResult) {
    const { req, res } = ctx;
    const { domain, address, protocol, isHTTPS } = dnsData;
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
