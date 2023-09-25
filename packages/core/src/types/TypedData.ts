export interface TypedDataArgument {
  name: string;
  type: string;
}

export type TypedDataTypes = {
  EIP712Domain: TypedDataArgument[];
  [key: string]: TypedDataArgument[];
};

export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

/**
 * EIP-712 typed data object
 * @see https://eips.ethereum.org/EIPS/eip-712
 */
export interface TypedData {
  types: TypedDataTypes;
  primaryType: string;
  domain: TypedDataDomain;
  message: object;
}
