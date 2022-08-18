import DWEBName from './DWEBName';
import DWEBRegistry from './DWEBRegistry';
import { DNSRecord, Record, RecordSet } from './RecordSet';
import { EthNetwork } from './contracts/interfaces';
import * as contentHash from './utils/content';
import { RecordType } from 'dns-packet';

export {
  EthNetwork,
  DNSRecord,
  Record,
  DWEBName,
  DWEBRegistry,
  RecordSet,
  RecordType,
  contentHash
};
