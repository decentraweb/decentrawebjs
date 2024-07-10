import { Network } from '@decentraweb/core';
import { config } from 'dotenv';
import { providers, Wallet } from 'ethers';

config({ path: '.test.env' });

const API_KEY = process.env.INFURA_API_KEY as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

export function getProvider(chain: 'ethereum' | 'polygon') {
  let network: Network;
  let provider: providers.BaseProvider;
  if (chain === 'ethereum') {
    network = 'sepolia';
    provider = new providers.JsonRpcProvider(`https://sepolia.infura.io/v3/${API_KEY}`);
  } else {
    network = 'matic-amoy';
    provider = new providers.JsonRpcProvider(`https://polygon-amoy.infura.io/v3/${API_KEY}`);
  }
  return {
    network,
    provider,
    signer: new Wallet(PRIVATE_KEY, provider)
  };
}
