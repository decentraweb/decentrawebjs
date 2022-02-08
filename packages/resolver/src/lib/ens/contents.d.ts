type ContentProtocol = 'ipfs' | 'ipns' | 'bzz' | 'onion' | 'onion3';

export function decodeContenthash(encoded: string): {
  protocolType?: ContentProtocol, decoded?: string, error?: Error
}

export function isValidContenthash(encoded: string): boolean
