import { TLDEntry } from './types/TLD.js';
import { DURATION, MAX_NAMES_PER_TX } from './constants.js';
import { normalizeName } from '../utils/name.cjs';

/**
 * Validates and normalizes domain names and durations for registration.
 * @param entries
 */
export function normalizeDomainEntries(entries: TLDEntry | Array<TLDEntry>): Array<TLDEntry> {
  const reqArray: Array<TLDEntry> = Array.isArray(entries) ? entries : [entries];
  if (reqArray.length > MAX_NAMES_PER_TX) {
    throw new Error(`Maximum number of names per transaction is ${MAX_NAMES_PER_TX}`);
  }
  return reqArray.map((item) => {
    let result: TLDEntry;
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

const VALID_DURATIONS: number[] = Object.values(DURATION);

/**
 * Validates and normalizes registration duration.
 * @param duration - duration in seconds
 */
export function normalizeDuration(duration: any): number {
  if (!Number.isFinite(duration)) {
    throw new Error(`Duration must be a number`);
  }
  if (!VALID_DURATIONS.includes(duration)) {
    throw new Error(`Duration must be one of ${VALID_DURATIONS.join(', ')}`);
  }
  return duration;
}
