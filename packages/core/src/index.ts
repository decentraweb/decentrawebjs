import DWEBName from './DWEBName';
import DWEBRegistry from './DWEBRegistry';
import * as registration from './DWEBRegistrar';
import { DNSRecord, Record, RecordSet, RecordType, RecordClass } from './RecordSet';
import { EthNetwork } from './contracts/interfaces';
import * as contentHash from './utils/content';

export const DWEBRegistrar = registration.DWEBRegistrar;


export {
  EthNetwork,
  DNSRecord,
  Record,
  DWEBName,
  DWEBRegistry,
  registration,
  RecordSet,
  RecordType,
  RecordClass,
  contentHash
};
