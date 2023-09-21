import { registrars } from '@decentraweb/core';
import { getProvider } from '../../lib/provider';
import { expect } from 'chai';
import { Chance } from 'chance';
import nameExists from '../../lib/assertions/nameExists';
const { DURATION, SubdomainRegistrar } = registrars;

const chance = new Chance();
const { network, provider, signer } = getProvider('polygon');

describe('Renewable subdomain registration', function () {
  let registrar: registrars.SubdomainRegistrar;
  beforeEach(() => {
    registrar = new SubdomainRegistrar({
      network: network,
      provider: provider,
      signer: signer
    });
  });

  it('should register a subdomain for staked domain for 2 years and pay in ETH/WETH', async function () {
    const subdomain = chance.word();
    const registration = await registrar.approveOndemandRegistration({
      name: 'renewable',
      label: subdomain,
      duration: DURATION.TWO_YEARS
    });
    expect(registration).to.have.property('approval');
    expect(registration.approval.durations[0]).to.be.equal(DURATION.TWO_YEARS);
    expect(registration.owner).to.be.equal(await signer.getAddress());
    expect(registration.isFeeInDWEB).to.be.false;
    const tx = await registrar.finishRegistration(registration);
    expect(tx).to.have.property('hash');
    await tx.wait(1);
    await nameExists(`${subdomain}.renewable`, 'polygon');
  });
});
