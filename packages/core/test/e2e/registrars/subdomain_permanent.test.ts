import { registrars } from '@decentraweb/core';
import { getProvider } from '../../lib/provider';
import { expect } from 'chai';
import { Chance } from 'chance';
import nameExists from '../../lib/assertions/nameExists';

const chance = new Chance();
const { network, provider, signer } = getProvider('polygon');

describe('Permanent subdomain registration', function () {
  let registrar: registrars.SubdomainRegistrar;
  beforeEach(() => {
    registrar = new registrars.SubdomainRegistrar({
      network: network,
      provider: provider,
      signer: signer
    });
  });

  it('should register a subdomain owned by signer and pay in ETH', async function () {
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
    await tx.wait(1);
    await nameExists(`${subdomain}.mocha`, 'polygon');
  });

  it('should register a subdomain owned by signer and pay in DWEB', async function () {
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
    await tx.wait(1);
    await nameExists(`${subdomain}.mocha`, 'polygon');
  });

  it('should register subdomain for staked domain and pay in ETH', async function () {
    const subdomain = chance.word();
    const registration = await registrar.approveOndemandRegistration({
      name: 'staked',
      label: subdomain
    });
    expect(registration).to.have.property('approval');
    expect(registration.owner).to.be.equal(await signer.getAddress());
    expect(registration.isFeeInDWEB).to.be.false;
    const tx = await registrar.finishRegistration(registration);
    expect(tx).to.have.property('hash');
    await tx.wait(1);
    await nameExists(`${subdomain}.staked`, 'polygon');
  });

  it('should register subdomain for staked domain and pay in DWEB', async function () {
    const subdomain = chance.word();
    const registration = await registrar.approveOndemandRegistration(
      {
        name: 'staked',
        label: subdomain
      },
      true
    );
    expect(registration).to.have.property('approval');
    expect(registration.owner).to.be.equal(await signer.getAddress());
    expect(registration.isFeeInDWEB).to.be.true;
    const tx = await registrar.finishRegistration(registration);
    expect(tx).to.have.property('hash');
    await tx.wait(1);
    await nameExists(`${subdomain}.staked`, 'polygon');
  });
});
