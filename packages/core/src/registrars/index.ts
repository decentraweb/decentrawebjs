import EthereumTLDRegistrar from './EthereumTLDRegistrar';
import PolygonTLDRegistrar from './PolygonTLDRegistrar';
import SubdomainRegistrar from './SubdomainRegistrar';
import { RegistrarConfig } from './BaseRegistrar';

export type { RegistrarConfig };
export * from './types/common';
export * from './types/StakingState';
export * from './types/Subdomain';
export * from './types/TLD';

export * from './constants';
export { EthereumTLDRegistrar, PolygonTLDRegistrar, SubdomainRegistrar };
