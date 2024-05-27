import { ethers, providers } from 'ethers';
import {
  AltToken,
  AltTokenConfig,
  NativeToken,
  Network,
  PolygonNetwork,
  Token
} from '../types/common';
import ERC20 from './ERC20.json';
import { isMaticChain } from '../utils/chains';

/**
 * Alternative token addresses for different Polygon networks. Used to pay for the registration fees.
 */
const ALT_TOKEN_ADDRESSES: Record<Network, AltTokenConfig> = {
  mainnet: {
    DWEB: '',
    WETH: null,
    USDC: '',
    USDT: ''
  },
  matic: {
    DWEB: '',
    WETH: '',
    USDC: '',
    USDT: ''
  },
  sepolia: {
    DWEB: '0x729f486266BAa402ab0A1F0fD8372Cd9C6dbcF3D',
    WETH: null,
    USDC: '0x8Ecd089629fEB41460dfD609de07170a7Fa84df7',
    USDT: '0x87bcd56fB904C919d80a5D06598958301EF417aF'
  },
  'matic-amoy': {
    DWEB: '0x817D50803b0db406696576f463b6b53952bF4fCD',
    WETH: '0xBb46b7A0f1cCbaE9D44EA55460aA8d6cDC4b2834',
    USDC: '0x8587a06ac54dB193C6D50C0E2649e38A92431587',
    USDT: '0x0300c60E81709fE6133165030751b709e3547429'
  }
};

export function isValidAltToken(network: Network, token: string): token is AltToken {
  token = token.toUpperCase() as Token;
  return !!getTokenAddress(network, token as AltToken);
}

export function isValidNativeToken(network: Network, token: string): token is NativeToken {
  token = token.toUpperCase() as Token;
  if (isMaticChain(network)) {
    return token === 'MATIC';
  }
  return token === 'ETH';
}

/**
 * Validate fee token and return token name, if not provided, returns native token name (ETH/MATIC)
 * @param network - Ethereum/Polygon network name
 * @param token - Token name (DWEB, WETH, USDC, USDT)
 */
export function validateFeeToken(network: Network, token?: string): Token {
  if (!token) {
    return isMaticChain(network) ? 'MATIC' : 'ETH';
  }
  token = token.toUpperCase() as Token;
  if (isValidNativeToken(network, token)) {
    return token;
  }
  if (isValidAltToken(network, token)) {
    return token;
  }
  throw new Error(`Token "${token}" is not supported for registration fee on ${network} network`);
}

/**
 * Get token contract address, returns null if token is not supported on the network
 * @param network - Ethereum/Polygon network name
 * @param token - Token name (DWEB, WETH, USDC, USDT)
 */
export function getTokenAddress(network: Network, token: AltToken): string | null {
  if (!ALT_TOKEN_ADDRESSES[network]) {
    throw new Error(`Unknown network "${network}"`);
  }
  return ALT_TOKEN_ADDRESSES[network][token] || null;
}

/**
 * Get fee token address for the network, for native tokens (ETH, MATIC) returns zero address
 * @param network
 * @param token
 */
export function getFeeTokenAddress(network: Network, token?: Token): string {
  token = validateFeeToken(network, token);
  if (token === 'ETH' || token === 'MATIC') {
    return ZERO_ADDRESS;
  }

  const address = getTokenAddress(network, token);
  if (!address) {
    throw new Error(`Token "${token}" is not supported on "${network}" network.`);
  }
  return address;
}

/**
 * Get Wrapped Ethereum token contract instance for Polygon network
 * @param network
 * @param token
 * @param provider
 */
export function getTokenContract(
  network: Network,
  token: AltToken,
  provider: ethers.Signer | providers.Provider
): ethers.Contract {
  const address = getTokenAddress(network, token);
  if (!address) {
    throw new Error(`Token "${token}" is not supported on "${network}" network.`);
  }
  return new ethers.Contract(address, ERC20, provider);
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
