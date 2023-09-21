import { DWEBRegistry } from '@decentraweb/core';
import { getProvider } from '../provider';
import { expect } from 'chai';

async function nameExists(domain: string, chain: 'ethereum' | 'polygon' = 'ethereum') {
  const { provider, network } = getProvider(chain);
  const dweb = new DWEBRegistry({ provider, network });
  let owner: string | null;
  try {
    const name = dweb.name(domain);
    owner = await name.getOwner();
  } catch (e) {
    owner = null;
  }
  expect(owner).to.be.not.null;
}

export default nameExists;
