import { Network } from '@decentraweb/core';
import { config } from 'dotenv';
import { providers, Wallet } from 'ethers';

config({ path: '.env.test' });

const API_KEY = process.env.INFURA_API_KEY as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

export function getProvider(chain: 'ethereum' | 'polygon') {
  let network: Network;
  let provider: providers.BaseProvider;
  if (chain === 'ethereum') {
    network = 'goerli';
    provider = new providers.JsonRpcProvider(`https://goerli.infura.io/v3/${API_KEY}`, 'goerli');
  } else {
    network = 'maticmum';
    provider = new providers.JsonRpcProvider(
      `https://polygon-mumbai.infura.io/v3/${API_KEY}`,
      'maticmum'
    );
  }
  return {
    network,
    provider,
    signer: new Wallet(PRIVATE_KEY, provider)
  };
}
