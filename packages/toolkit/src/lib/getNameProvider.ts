import { ICANN_TLDS } from './icann';
import { DomainProvider } from '../types';

function getTLD(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .split('.')
      .filter((s) => !!s)
      .pop() || ''
  );
}

export async function getNameProvider(domain: string): Promise<DomainProvider> {
  const tld = getTLD(domain);
  if (tld === 'eth') {
    return 'ens';
  }
  //TODO: Once we support hosting ICANN names on DWEB we will need to rewrite this
  if (ICANN_TLDS[tld]) {
    return 'icann';
  }
  return 'dweb';
}

export default getNameProvider;
