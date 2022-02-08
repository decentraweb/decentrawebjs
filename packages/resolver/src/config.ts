import dotenv from 'dotenv'
import {EthNetwork} from "./lib/ens/base";
dotenv.config()

const config = {
  "resolver_port": parseInt(process.env.RESOLVER_PORT || '') || 53,
  "doh_port": parseInt(process.env.DOH_PORT || '') || 80,
  "resolver_addr": process.env.RESOLVER_ADDR || '0.0.0.0',
  "eth_network": process.env.ETH_NETWORK as EthNetwork,
  "jsonrpc_url": process.env.JSONRPC_URL as string,
  "ipfs_gateway": {
    "A": process.env.IPFS_A ? process.env.IPFS_A.split(' ') : [],
    "AAAA": process.env.IPFS_AAAA ? process.env.IPFS_AAAA.split(' ') : [],
  }
}

export default config
