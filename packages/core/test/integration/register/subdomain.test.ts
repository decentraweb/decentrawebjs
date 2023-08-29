import { SubdomainRegistrar } from '../../../src/registrars';
import { network, provider, signer } from '../../lib/provider';
import { expect } from 'chai';
import { Chance } from 'chance';

const chance = new Chance();

describe('Subdomain registration', () => {
  let registrar: SubdomainRegistrar;
  beforeEach(() => {
    registrar = new SubdomainRegistrar({
      network: network,
      provider: provider,
      signer: signer
    });
  });

  it('should register a subdomain owned by signer and pay in WETH', async () => {
    const subdomain = chance.word();
    const registration = await registrar.approveSelfRegistration({
      name: 'mocha',
      label: subdomain
    });
    expect(registration).to.have.property('approval');
    expect(registration.owner).to.be.equal(await signer.getAddress());
    expect(registration.isFeeInDWEB).to.be.false;
    const tx = await registrar.finishRegistration(registration);
    expect(tx).to.have.property('hash');
    const receipt = await tx.wait(1);
    expect(receipt).to.have.property('transactionHash');
    expect(receipt).to.have.property('blockNumber');
  });

  it('should register a subdomain owned by signer and pay in DWEB', async () => {
    const subdomain = chance.word();
    const registration = await registrar.approveSelfRegistration(
      { name: 'mocha', label: subdomain },
      true
    );
    expect(registration).to.have.property('approval');
    expect(registration.owner).to.be.equal(await signer.getAddress());
    expect(registration.isFeeInDWEB).to.be.true;
    const tx = await registrar.finishRegistration(registration);
    expect(tx).to.have.property('hash');
    const receipt = await tx.wait(1);
    expect(receipt).to.have.property('transactionHash');
    expect(receipt).to.have.property('blockNumber');
  });
});
