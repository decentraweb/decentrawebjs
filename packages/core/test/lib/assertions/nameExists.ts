import { DWEBRegistry } from '../../../src';
import { network, provider } from '../provider';
import { expect } from 'chai';

async function nameExists(domain: string) {
  const dweb = new DWEBRegistry({ provider: provider, network: network });
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
