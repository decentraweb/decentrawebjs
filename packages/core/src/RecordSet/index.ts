import { answer as answerCoder } from 'dns-packet';
import * as recordType from './type';
import { Buffer } from 'buffer';
import { DNSRecord } from './DNSRecord';

export class RecordSet {
  static recordType = recordType;

  static decode(buf: Buffer): DNSRecord[] {
    let offset = 0;
    const result = [];
    while (offset < buf.length) {
      result.push(answerCoder.decode(buf, offset));
      offset += answerCoder.decode.bytes;
    }
    return result;
  }

  static encode(records: DNSRecord[]): Buffer {
    const buffers: Buffer[] = [];
    records.forEach((record) => {
      buffers.push(answerCoder.encode(record));
    });
    return Buffer.concat(buffers);
  }
}

export default RecordSet;
