import {answer as answerCoder} from 'dns-packet';
import * as recordType from './type';
import {Buffer} from 'buffer';
import {DNSRecord, Record} from "./DNSRecord";

export {DNSRecord, Record};

export class RecordSet {
  static decode(buf: Buffer): DNSRecord[] {
    let offset = 0
    const result = []
    while (offset < buf.length) {
      result.push(answerCoder.decode(buf, offset))
      offset += answerCoder.decode.bytes
    }
    return result
  }

  static encode(records: DNSRecord[]): Buffer {
    const buffers: Buffer[] = [];
    records.forEach((record) => {
      buffers.push(answerCoder.encode(record))
    })
    return Buffer.concat(buffers)
  }

  static recordType = recordType;
}

export default RecordSet
