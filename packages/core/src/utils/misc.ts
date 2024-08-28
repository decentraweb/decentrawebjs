export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function increaseByPercent(value: bigint, percent: number): bigint {
  return value + (value * BigInt(percent)) / BigInt(100);
}
