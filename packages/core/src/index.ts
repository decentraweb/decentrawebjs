import DWEBName from './DWEBName';
import DWEBRegistry from './DWEBRegistry';
import * as contracts from './contracts';
import * as registration from './EthereumTLDRegistrar';
import { DNSRecord, Record, RecordSet, RecordType, RecordClass } from './RecordSet';
import { EthNetwork } from './contracts/interfaces';
import * as contentHash from './utils/content';

export const EthereumTLDRegistrar = registration.EthereumTLDRegistrar;


export {
  EthNetwork,
  DNSRecord,
  Record,
  DWEBName,
  DWEBRegistry,
  registration,
  contracts,
  RecordSet,
  RecordType,
  RecordClass,
  contentHash
};
