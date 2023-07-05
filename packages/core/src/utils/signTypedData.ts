import { Signer } from 'ethers';

export interface TypedData {
  types: TypedDataTypes;
  primaryType: string;
  domain: TypedDataDomain;
  message: object;
}

export type TypedDataTypes = {
  [key: string]: TypedDataArgument[];
};

export interface TypedDataArgument {
  name: string;
  type: string;
}

export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: number;
  verifyingContract?: string;
  salt?: string;
}

async function signTypedData(signer: Signer, typedData: TypedData): Promise<string> {
  //Ethers.js inserts the EIP712Domain type into the types object, so we need to remove it before signing
  const types = { ...typedData.types };
  delete types.EIP712Domain;
  //@ts-ignore
  return signer._signTypedData(typedData.domain, types, typedData.message);
}

export default signTypedData;
