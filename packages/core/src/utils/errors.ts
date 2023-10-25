import { Network } from '../types/common';

export const ErrorCodes = {
  NOT_SUPPORTED: 'E_NOT_SUPPORTED',
  SIGNER_REQUIRED: 'E_SIGNER_REQUIRED'
};

export class NotSupportedError extends Error {
  readonly code = ErrorCodes.NOT_SUPPORTED;

  constructor(method: string, network: Network) {
    super(`Method ${method} is not supported on ${network} network`);
  }
}

export class SignerRequiredError extends Error {
  readonly code = ErrorCodes.SIGNER_REQUIRED;

  constructor() {
    super('Signer is required to call non-constant methods');
  }
}
