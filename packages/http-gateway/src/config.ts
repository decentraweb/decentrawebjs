import dotenv from 'dotenv';
import { ApiProvider } from '@decentraweb/namekit';

dotenv.config();

const config = {
  gateway_port: parseInt(process.env.GATEWAY_PORT || '') || 80,
  gateway_secure_port: parseInt(process.env.GATEWAY_HTTPS_PORT || '') || 443,
  gateway_domain: process.env.GATEWAY_DOMAIN || 'dwebs.to',
  provider: process.env.PROVIDER as ApiProvider,
  api_key: process.env.API_KEY as string,
  production: process.env.PRODUCTION === 'true',
  sentry_dsn: (process.env.SENTRY_DSN as string) || '',
  ipfs_gateway: process.env.IPFS_GATEWAY as string,
  cert_maintainer_email: process.env.CERT_MAINTAINER_EMAIL as string,
  cert_storage_dir: process.env.CERT_STORAGE_DIR as string
};

export default config;
