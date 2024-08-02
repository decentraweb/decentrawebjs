import { Answer, answer as answerCoder } from 'dns-packet';
import * as recordType from './type';
import { Buffer } from 'buffer';

/**
 * Helper class for encoding and decoding DNS records. Record set is an array of DNS records.
 */
export class RecordSet {
  static recordType = recordType;

  /**
   * Decodes a buffer into an array of DNS records.
   * @param buf - dns record in binary format
   */
  static decode<T = Answer>(buf: Buffer): T[] {
    let offset = 0;
    const result: T[] = [];
    while (offset < buf.length) {
      result.push(answerCoder.decode(buf, offset));
      offset += answerCoder.decode.bytes;
    }
    return result;
  }

  /**
   * Encodes an array of DNS records into a binary format.
   * @param records
   */
  static encode(records: Answer[]): Buffer {
    const buffers: Buffer[] = [];
    records.forEach((record) => {
      buffers.push(answerCoder.encode(record));
    });
    return Buffer.concat(buffers);
  }
}

export default RecordSet;
