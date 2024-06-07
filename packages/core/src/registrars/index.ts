import TLDRegistrar from './TLDRegistrar';
import MetaTLDRegistrar from './MetaTLDRegistrar';
import SubdomainRegistrar from './SubdomainRegistrar';
import { RegistrarConfig } from './BaseRegistrar';

export type { RegistrarConfig };
export * from './types/common';
export * from './types/StakingState';
export * from './types/Subdomain';
export * from './types/TLD';

export * from './constants';
export { TLDRegistrar, MetaTLDRegistrar, SubdomainRegistrar };
