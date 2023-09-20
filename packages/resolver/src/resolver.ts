import { providers } from 'ethers';
import UDPResolver from './lib/UDPResolver';
import TCPResolver from './lib/TCPResolver';
import DOHResolver from './lib/DOHResolver';
import config from './config';
import { ResolverConfig } from './lib/Resolver';

const resolverConfig: ResolverConfig = {
  blockchain: {
    ethereum: {
      network: config.eth_network,
      provider: new providers.JsonRpcProvider(config.eth_jsonrpc_url, config.eth_network)
    },
    polygon: {
      network: config.polygon_network,
      provider: new providers.JsonRpcProvider(config.polygon_jsonrpc_url, config.eth_network)
    }
  },
  ipfsGateway: config.ipfs_gateway
};

const udpServer = new UDPResolver(resolverConfig);

const tcpServer = new TCPResolver(resolverConfig);

const dohServer = new DOHResolver({
  ...resolverConfig,
  cors: true
});

udpServer.listen(config.resolver_port, config.resolver_addr).then(() => {
  console.log(`UDP resolver listening on ${config.resolver_addr}:${config.resolver_port}`);
});

tcpServer.listen(config.resolver_port, config.resolver_addr).then(() => {
  console.log(`TCP resolver listening on ${config.resolver_addr}:${config.resolver_port}`);
});

dohServer.listen(config.doh_port).then(() => {
  console.log(`DOH resolver listening on ${config.doh_port}`);
});
