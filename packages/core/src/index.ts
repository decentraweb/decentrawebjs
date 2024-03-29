import DWEBName from './DWEBName';
import DWEBRegistry from './DWEBRegistry';
import RecordSet from './RecordSet';
import * as api from './api';
import * as contentHash from './utils/content';
import * as contracts from './contracts';
import * as errors from './errors';
import * as graph from './graph';
import * as registrars from './registrars';
import * as utils from './utils';

export * from './types/common';
export * from './types/TypedData';
export type { DNSRecord, Record, RecordClass, RecordType } from './RecordSet/DNSRecord';

export {
  DWEBName,
  DWEBRegistry,
  RecordSet,
  api,
  contentHash,
  contracts,
  errors,
  graph,
  registrars,
  utils
};
