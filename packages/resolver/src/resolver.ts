import {providers} from "ethers";
import UDPResolver from "./lib/UDPResolver";
import TCPResolver from "./lib/TCPResolver";
import DOHResolver from "./lib/DOHResolver";
import config from "./config";

const provider = new providers.JsonRpcProvider(config.jsonrpc_url, config.eth_network);

const udpServer = new UDPResolver({
  network: config.eth_network,
  provider: provider,
  ipfsGateway: config.ipfs_gateway
});

const tcpServer = new TCPResolver({
  network: config.eth_network,
  provider: provider,
  ipfsGateway: config.ipfs_gateway
});

const dohServer = new DOHResolver({
  cors: true,
  network: config.eth_network,
  provider: provider,
  ipfsGateway: config.ipfs_gateway
});

udpServer
  .listen(config.resolver_port, config.resolver_addr)
  .then(()=>{
    console.log(`UDP resolver listening on ${config.resolver_addr}:${config.resolver_port}`)
  });

tcpServer
  .listen(config.resolver_port, config.resolver_addr)
  .then(()=>{
    console.log(`TCP resolver listening on ${config.resolver_addr}:${config.resolver_port}`)
  });

dohServer
  .listen(config.doh_port)
  .then(()=>{
    console.log(`DOH resolver listening on ${config.doh_port}`)
  });
