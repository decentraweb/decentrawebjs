import EthereumTLDRegistrar from './EthereumTLDRegistrar/index.js';
import PolygonTLDRegistrar from './PolygonTLDRegistrar/index.js';
import SubdomainRegistrar from './SubdomainRegistrar/index.js';
import { RegistrarConfig } from './BaseRegistrar.js';

export type { RegistrarConfig };
export * from './types/common.js';
export * from './types/StakingState.js';
export * from './types/Subdomain.js';
export * from './types/TLD.js';

export * from './constants.js';
export { EthereumTLDRegistrar, PolygonTLDRegistrar, SubdomainRegistrar };
