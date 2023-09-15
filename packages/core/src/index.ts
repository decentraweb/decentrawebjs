import DWEBName from './DWEBName';
import DWEBRegistry from './DWEBRegistry';
import * as api from './api';
import * as contracts from './contracts';
import * as registration from './registrars';
import RecordSet from './RecordSet';
import * as contentHash from './utils/content';

export * from './types/common';
export * from './types/TypedData';
export type { DNSRecord, Record, RecordClass, RecordType } from './RecordSet/DNSRecord';

export { DWEBName, DWEBRegistry, RecordSet, contentHash, registration, contracts, api };
