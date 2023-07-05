import DWEBName from './DWEBName';
import DWEBRegistry from './DWEBRegistry';
import * as contracts from './contracts';
import * as tld from './EthereumTLDRegistrar';
import * as sld from './EthereumSubdomainRegistrar';
import RecordSet from './RecordSet';
import * as contentHash from './utils/content';

export  type { EthNetwork } from './contracts/interfaces';
export  type { DNSRecord, Record, RecordClass, RecordType } from './RecordSet/DNSRecord';

export {
  DWEBName,
  DWEBRegistry,
  RecordSet,
  contentHash,
  tld,
  sld,
  contracts,
};
