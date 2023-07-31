import { normalize } from '@ensdomains/eth-ens-namehash';
import { DomainEntry } from './types';
import { MAX_DURATION, MAX_NAMES_PER_TX, MIN_DURATION } from './constants';

/**
 * Validates and normalizes domain names and durations for registration.
 * @param requests
 */
export function normalizeDomainEntries(
  requests: DomainEntry | Array<DomainEntry>
): Array<DomainEntry> {
  const reqArray: Array<DomainEntry> = Array.isArray(requests) ? requests : [requests];
  if (reqArray.length > MAX_NAMES_PER_TX) {
    throw new Error(`Maximum number of names per transaction is ${MAX_NAMES_PER_TX}`);
  }
  return reqArray.map((item) => {
    let result: DomainEntry;
    try {
      result = {
        name: normalizeName(item.name),
        duration: normalizeDuration(item.duration)
      };
    } catch (e: any) {
      throw new Error(`Invalid mint request ${JSON.stringify(item)}: ${e.message}`);
    }
    return result;
  });
}

export function normalizeName(name: string): string {
  return normalize(name);
}

export function normalizeDuration(duration: any): number {
  if (!Number.isFinite(duration)) {
    throw new Error(`Duration must be a number`);
  }
  if (duration < MIN_DURATION || duration > MAX_DURATION) {
    throw new Error(`Duration must be between ${MIN_DURATION} and ${MAX_DURATION}`);
  }
  return duration;
}
