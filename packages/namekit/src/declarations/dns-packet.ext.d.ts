import 'dns-packet';

declare module 'dns-packet' {
  export const name: {
    encode(str: string, buf?: Buffer, offset?: number): Buffer;
    decode(buf: Buffer, offset?: number): string;
  };

  export namespace answer {
    export function encode(records: Record<string, any>, buf?: Buffer, offset?: number): Buffer;

    export function decode(buf: Buffer, offset?: number): any;

    namespace decode {
      export const bytes: number;
    }
  }
}
