import DWEBDomain from './domain/DWEBDomain';
import ENSDomain from './domain/ENSDomain/index';
import ICANNDomain from './domain/ICANNDomain';
import { DwebNamekit, getDefaultConfig } from './DwebNamekit';

export * from './types/index';

export { ENSDomain, DWEBDomain, ICANNDomain, DwebNamekit, getDefaultConfig };

export default DwebNamekit;
