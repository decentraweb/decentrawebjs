import { BigNumber } from 'ethers';

export abstract class DwebError extends Error {
  abstract code: string;

  constructor(message: string) {
    super(message);
  }
}

export class DwebApiError extends DwebError {
  readonly code: string = 'API_ERROR';
  // HTTP status code
  readonly status: number;
  // Response object
  readonly response: Response;
  // Parsed response data
  readonly data: any;

  constructor(response: Response, message: string, data: any) {
    super(`API error: ${message}`);
    this.status = response.status;
    this.response = response;
    this.data = data;
  }

  static async fromResponse(response: Response): Promise<DwebApiError> {
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = await response.text();
    }
    const message = data?.message || data?.error || 'Unknown error';
    return new DwebApiError(response, message, data);
  }
}

export class InsufficientAllowanceError extends DwebError {
  readonly code: string = 'INSUFFICIENT_ALLOWANCE';
  readonly allowedAmount: BigNumber;
  readonly requiredAmount: BigNumber;
  readonly token: string;

  constructor(allowed: BigNumber, required: BigNumber, token: string) {
    super(`Insufficient ${token} allowance. ${required} wei needed, ${allowed} wei approved.`);
    this.allowedAmount = allowed;
    this.requiredAmount = required;
    this.token = token;
  }
}

export class InsufficientBalanceError extends DwebError {
  readonly code: string = 'INSUFFICIENT_BALANCE';
  readonly balance: BigNumber;
  readonly requiredAmount: BigNumber;
  readonly token: string;

  constructor(balance: BigNumber, required: BigNumber, token: string) {
    super(`Insufficient ${token} balance. ${required} wei needed, ${balance} wei found.`);
    this.balance = balance;
    this.requiredAmount = required;
    this.token = token;
  }
}
