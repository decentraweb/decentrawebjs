import dotenv from 'dotenv';
import { EthNetwork } from '@decentraweb/core';

dotenv.config();

const config = {
  gateway_port: parseInt(process.env.GATEWAY_PORT || '') || 80,
  gateway_domain: process.env.GATEWAY_DOMAIN || 'dwebs.to',
  eth_network: process.env.ETH_NETWORK as EthNetwork,
  jsonrpc_url: process.env.JSONRPC_URL as string,
  ipfs_gateway: process.env.IPFS_GATEWAY as string
};

export default config;
