import Cache from './Cache';
import { DWEBName } from '@decentraweb/core';

const CACHE = new Cache<boolean>(5 * 60 * 1000);

export async function hasResolver(name: DWEBName) {
  const cached = await CACHE.read(name.namehash);
  if (typeof cached !== 'undefined') {
    return cached;
  }
  const hasResolver = await name.hasResolver();
  await CACHE.write(name.namehash, hasResolver);
  return hasResolver;
}
