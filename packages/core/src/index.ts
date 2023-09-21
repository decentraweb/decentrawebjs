import DWEBName from './DWEBName.js';
import DWEBRegistry from './DWEBRegistry.js';
import * as api from './api/index.js';
import * as contracts from './contracts/index.js';
import * as registrars from './registrars/index.js';
import RecordSet from './RecordSet/index.js';
import * as contentHash from './utils/content.js';
import * as utils from './utils/index.js';

export * from './types/common.js';
export * from './types/TypedData.js';
export type { DNSRecord, Record, RecordClass, RecordType } from './RecordSet/DNSRecord.js';

export { DWEBName, DWEBRegistry, RecordSet, contentHash, registrars, contracts, api, utils };
