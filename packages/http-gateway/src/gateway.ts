import HTTPGateway from './index';
import { providers } from 'ethers';
import config from './config';

const provider = new providers.JsonRpcProvider(config.jsonrpc_url, config.eth_network);
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
