import UDPResolver from './lib/UDPResolver';
import TCPResolver from './lib/TCPResolver';
import DOHResolver from './lib/DOHResolver';
import config from './config';
import { ResolverConfig } from './lib/Resolver';

const resolverConfig: ResolverConfig = {
  blockchain: {
    apiProvider: config.provider,
    apiKey: config.apiKey,
    production: config.production
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
