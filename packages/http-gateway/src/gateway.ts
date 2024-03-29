import * as Sentry from '@sentry/node';
import { addExtensionMethods } from '@sentry/tracing';
import HTTPGateway from './index';
import { providers } from 'ethers';
import config from './config';

const KEEPALIVE_INTERVAL = 10000;
const PROVIDER_TIMEOUT = 3000;

if (config.sentry_dsn) {
  Sentry.init({
    environment: process.env.NODE_ENV,
    dsn: config.sentry_dsn,
    serverName: config.gateway_domain,
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 0.1,
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true })
    ]
  });
  addExtensionMethods();
}

const provider = new providers.WebSocketProvider(config.websocket_url, config.eth_network);

setInterval(() => {
  const responseTimeout = setTimeout(() => {
    throw new Error('Ethereum provider timed out');
  }, PROVIDER_TIMEOUT);
  provider.getBlockNumber().then(() => {
    clearTimeout(responseTimeout);
  });
}, KEEPALIVE_INTERVAL);

const gateway = new HTTPGateway({
  baseDomain: config.gateway_domain,
  ipfsGatewayIp: config.ipfs_gateway,
  network: config.eth_network,
  provider,
  certs: {
    maintainerEmail: config.cert_maintainer_email,
    storageDir: config.cert_storage_dir
  }
});

gateway.listenHttp(config.gateway_port).then(() => {
  console.log(`Decentraweb HTTP gateway listening port ${config.gateway_port}`);
});
gateway.listenHttps(config.gateway_secure_port).then(() => {
  console.log(`Decentraweb HTTPS gateway listening port ${config.gateway_secure_port}`);
});
