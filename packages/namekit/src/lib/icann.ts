import TLDs from './icann_tlds.json';

export const ICANN_TLDS: Record<string, true> = TLDs.reduce(
  (tlds: Record<string, true>, tld: string) => {
    tlds[tld] = true;
    return tlds;
  },
  {}
);
