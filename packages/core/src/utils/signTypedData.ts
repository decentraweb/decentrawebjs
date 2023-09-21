import { Signer } from 'ethers';
import { TypedData } from '../types/TypedData.js';

async function signTypedData(signer: Signer, typedData: TypedData): Promise<string> {
  //Ethers.js inserts the EIP712Domain type into the types object, so we need to remove it before signing
  const types: any = { ...typedData.types };
  delete types.EIP712Domain;
  //@ts-ignore
  return signer._signTypedData(typedData.domain, types, typedData.message);
}

export default signTypedData;
