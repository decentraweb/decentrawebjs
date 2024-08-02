import 'dns-packet';
import { Answer } from 'dns-packet';

declare module 'dns-packet' {
  export const name: {
    encode(str: string, buf?: Buffer, offset?: number): Buffer;
    decode(buf: Buffer, offset?: number): string;
  };

  export namespace answer {
    export function encode(record: Answer, buf?: Buffer, offset?: number): Buffer;

    export function decode<T = Answer>(buf: Buffer, offset?: number): T;
    namespace decode {
      // Indicated the number of bytes used to decode the answer
      export const bytes: number;
    }
  }
}
