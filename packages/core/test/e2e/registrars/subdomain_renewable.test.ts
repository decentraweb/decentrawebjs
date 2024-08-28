import { registrars } from '@decentraweb/core';
import { getProvider } from '../../lib/provider';
import { expect } from 'chai';
import { Chance } from 'chance';
import nameExists from '../../lib/assertions/nameExists';
import { TEST_DOMAINS } from '../../constants';
const { DURATION, SubdomainRegistrar } = registrars;

const chance = new Chance();
const { network, provider, signer } = getProvider('ethereum');

describe('Renewable subdomain registration', function () {
  let registrar: registrars.SubdomainRegistrar;
  before(async () => {
    const registrar = new registrars.SubdomainRegistrar({
      network: network,
      provider: provider,
      signer: signer
    });
  });
  beforeEach(() => {
    registrar = new SubdomainRegistrar({
      network: network,
      provider: provider,
      signer: signer
    });
  });

  it('should register a subdomain for staked domain for 2 years and pay in ETH', async function () {
    const subdomain = chance.word();
    const registration = await registrar.approveOndemandRegistration({
      name: TEST_DOMAINS.RENEWABLE,
      label: subdomain,
      duration: DURATION.TWO_YEARS
    });
    expect(registration).to.have.property('approval');
    expect(registration.approval.durations[0]).to.be.equal(DURATION.TWO_YEARS);
    expect(registration.owner).to.be.equal(await signer.getAddress());
    expect(registration.feeToken).to.be.equal('ETH');
    const tx = await registrar.finishRegistration(registration);
    expect(tx).to.have.property('hash');
    await tx.wait(1);
    await nameExists(`${subdomain}.${TEST_DOMAINS.RENEWABLE}`, 'ethereum');
  });
});
