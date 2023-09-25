import { BigNumber } from 'ethers';

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function increaseByPercent(value: BigNumber, percent: number): BigNumber {
  return value.add(value.mul(percent).div(100));
}
