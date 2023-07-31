/**
 * Standard duration values for registration.
 */
export const DURATION = {
  ONE_YEAR: 31556926,
  TWO_YEARS: 63113852,
  THREE_YEARS: 94670778,
  FOUR_YEARS: 126227704,
  FIVE_YEARS: 157784630
};

export const MIN_DURATION = 31556926; // 1 year
export const MAX_DURATION = 157784630; // 5 years
export const MAX_NAMES_PER_TX = 20;

/**
 * Time to live for registration approval.
 */
export const APPROVAL_TTL = 30 * 60; // 30 minutes
/**
 * Time to wait before calling `register` after `sendCommitment` call.
 */
export const REGISTRATION_WAIT = 60 * 1000; // 1 minute