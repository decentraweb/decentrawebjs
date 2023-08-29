import {config} from 'dotenv';
import { providers, Wallet } from 'ethers';
import {EthNetwork} from "../../src";

config({path: '.env.test'});
export const network = process.env.ETH_NETWORK as EthNetwork;

export const provider = new providers.JsonRpcProvider(
  process.env.JSONRPC_URL,
  process.env.ETH_NETWORK
);
//Signer only required if you want to write data to blockchain
export const signer = new Wallet(process.env.PRIVATE_KEY as string, provider);
