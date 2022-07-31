import HTTPGateway from './index';
import { providers } from 'ethers';
import config from './config';

const provider = new providers.JsonRpcProvider(config.jsonrpc_url, config.eth_network);
const gateway = new HTTPGateway({
  baseDomain: config.gateway_domain,
  ipfsGatewayIp: config.ipfs_gateway,
  network: config.eth_network,
  provider
});

gateway.listen(config.gateway_port).then(() => {
  console.log(`Decentraweb gateway listening port ${config.gateway_port}`);
});
