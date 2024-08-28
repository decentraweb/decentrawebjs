import { Network } from '@decentraweb/core';
import { config } from 'dotenv';
import { JsonRpcProvider, Wallet } from 'ethers';

config({ path: '.test.env' });

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL as string;
const AMOY_RPC_URL = process.env.AMOY_RPC_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

export function getProvider(chain: 'ethereum' | 'polygon') {
  let network: Network;
  let provider: JsonRpcProvider;
  if (chain === 'ethereum') {
    network = 'sepolia';
    provider = new JsonRpcProvider(SEPOLIA_RPC_URL);
  } else {
    network = 'matic-amoy';
    provider = new JsonRpcProvider(AMOY_RPC_URL);
  }
  return {
    network,
    provider,
    signer: new Wallet(PRIVATE_KEY, provider)
  };
}
