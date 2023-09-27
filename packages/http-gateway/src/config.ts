import dotenv from 'dotenv';
import { EthereumNetwork, PolygonNetwork } from '@decentraweb/core';

dotenv.config();

const config = {
  gateway_port: parseInt(process.env.GATEWAY_PORT || '') || 80,
  gateway_secure_port: parseInt(process.env.GATEWAY_HTTPS_PORT || '') || 443,
  gateway_domain: process.env.GATEWAY_DOMAIN || 'dwebs.to',
  eth_network: process.env.ETH_NETWORK as EthereumNetwork,
  poly_network: process.env.POLY_NETWORK as PolygonNetwork,
  eth_websocket_url: process.env.ETH_WEBSOCKET_URL as string,
  poly_websocket_url: process.env.POLY_WEBSOCKET_URL as string,
  sentry_dsn: (process.env.SENTRY_DSN as string) || '',
  ipfs_gateway: process.env.IPFS_GATEWAY as string,
  cert_maintainer_email: process.env.CERT_MAINTAINER_EMAIL as string,
  cert_storage_dir: process.env.CERT_STORAGE_DIR as string
};

export default config;
