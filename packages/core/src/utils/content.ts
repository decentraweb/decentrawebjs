import contentHash from '@ensdomains/content-hash';
import { ethers } from 'ethers';
import bs58 from 'bs58';

const utils = ethers.utils;

//Helpers based on https://github.com/ensdomains/ensjs/blob/master/src/utils/contents.js

export type ContentProtocol = 'ipfs' | 'ipns' | 'bzz' | 'onion' | 'onion3';

export type Codec = 'ipfs-ns' | 'ipns-ns' | 'swarm-ns' | 'onion' | 'onion3';

const PROTOCOL_MAP: Record<ContentProtocol, Codec> = {
  ipfs: 'ipfs-ns',
  ipns: 'ipns-ns',
  bzz: 'swarm-ns',
  onion: 'onion',
  onion3: 'onion3'
};

const CODEC_MAP: Record<Codec, ContentProtocol> = Object.entries(PROTOCOL_MAP).reduce(
  (r: any, [proto, codec]) => {
    r[codec] = proto as ContentProtocol;
    return r;
  },
  {}
);

export interface Content {
  protocol: ContentProtocol | null;
  data: string;
}

export function decode(encoded: string): string {
  let decoded = contentHash.decode(encoded);
  const codec = contentHash.getCodec(encoded) as Codec;
  switch (codec) {
    case 'ipns-ns':
      decoded = bs58.decode(decoded).slice(2).toString();
      break;
  }
  return CODEC_MAP[codec] ? `${CODEC_MAP[codec]}://${decoded}` : decoded;
}

export function encode(text: string): string | null {
  if (!text) {
    return null;
  }
  let matched =
    text.match(/^(ipfs|ipns|bzz|onion|onion3):\/\/(.*)/) ||
    text.match(/\/(ipfs)\/(.*)/) ||
    text.match(/\/(ipns)\/(.*)/);
  if (!matched) {
    return null;
  }
  const contentType = matched[1];
  const content = matched[2];
  let encoded = null;

  if (contentType === 'ipfs') {
    if (content.length >= 4) {
      encoded = '0x' + contentHash.encode('ipfs-ns', content);
    }
  } else if (contentType === 'ipns') {
    let bs58content = bs58.encode(
      Buffer.concat([Buffer.from([0, content.length]), Buffer.from(content)])
    );
    encoded = '0x' + contentHash.encode('ipns-ns', bs58content);
  } else if (contentType === 'bzz') {
    if (content.length >= 4) {
      encoded = '0x' + contentHash.fromSwarm(content);
    }
  } else if (contentType === 'onion') {
    if (content.length == 16) {
      encoded = '0x' + contentHash.encode('onion', content);
    }
  } else if (contentType === 'onion3') {
    if (content.length == 56) {
      encoded = '0x' + contentHash.encode('onion3', content);
    }
  } else {
    throw new Error(`Unsupported protocol or invalid value: ${text}`);
  }
  return encoded;
}

export function isValid(encoded: string): boolean {
  try {
    const codec = contentHash.getCodec(encoded) as Codec;
    return utils.isHexString(encoded) && !!CODEC_MAP[codec];
  } catch (e) {
    console.log(e);
    return false;
  }
}
