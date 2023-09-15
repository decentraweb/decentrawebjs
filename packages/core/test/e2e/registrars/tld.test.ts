import { DURATION, EthereumTLDRegistrar, PolygonTLDRegistrar } from '../../../src/registrars';
import { expect } from 'chai';
import { Chance } from 'chance';
import nameExists from '../../lib/assertions/nameExists';
import { getProvider } from '../../lib/provider';
import { wait } from '../../lib/utils';
import { providers, Signer } from 'ethers';

import { Network } from '../../../src';

const chance = new Chance();

describe('Register TLD', function () {
  let owner: string;
  let provider: providers.BaseProvider;
  let signer: Signer;
  let network: Network;

  describe('on Ethereum', function () {
    let registrar: EthereumTLDRegistrar;
    beforeEach(async () => {
      const data = getProvider('ethereum');
      network = data.network;
      provider = data.provider;
      signer = data.signer;
      owner = await signer.getAddress();
      registrar = new EthereumTLDRegistrar({
        network: network,
        provider: provider,
        signer: signer
      });
    });

    it('should register a TLD and pay with ETH', async function () {
      const domain = chance.word({ syllables: 3 });
      const entry = {
        name: domain,
        duration: DURATION.ONE_YEAR
      };
      const approval = await registrar.requestApproval(entry);
      expect(approval.status).to.be.equal('approved');
      expect(approval.domains[0]).to.deep.equal(entry);
      expect(approval.owner).to.be.equal(owner);
      const commitment = await registrar.sendCommitment(approval);
      expect(commitment.status).to.be.equal('committed');
      expect(commitment).to.have.property('tx');
      await commitment.tx.wait(1);
      await wait(60000);
      const tx = await registrar.register(commitment);
      await tx.wait(1);
      await nameExists(domain, 'ethereum');
    });

    it('should register a TLD and pay with DWEB', async function () {
      const domain = chance.word({ syllables: 3 });
      const entry = {
        name: domain,
        duration: DURATION.ONE_YEAR
      };
      const approval = await registrar.requestApproval(entry);
      expect(approval.status).to.be.equal('approved');
      expect(approval.domains[0]).to.deep.equal(entry);
      expect(approval.owner).to.be.equal(owner);
      const commitment = await registrar.sendCommitment(approval);
      expect(commitment.status).to.be.equal('committed');
      expect(commitment).to.have.property('tx');
      await commitment.tx.wait(1);
      await wait(60000);
      const tx = await registrar.register(commitment, true);
      await tx.wait(1);
      await nameExists(domain, 'ethereum');
    });
  });

  describe('on Polygon', function () {
    let registrar: PolygonTLDRegistrar;
    beforeEach(async () => {
      const data = getProvider('polygon');
      network = data.network;
      provider = data.provider;
      signer = data.signer;
      registrar = new PolygonTLDRegistrar({
        network: network as any,
        provider: provider,
        signer: signer
      });
    });

    it('should register a TLD and pay with ETH', async function () {
      const domain = chance.word({ syllables: 3 });
      const entry = {
        name: domain,
        duration: DURATION.ONE_YEAR
      };
      const commitment = await registrar.sendCommitment(entry);
      expect(commitment.status).to.be.equal('committed');
      expect(commitment.data).to.have.property('secret');
      expect(commitment.data).to.have.property('timestamp');
      await wait(60000);
      const tx = await registrar.register(commitment);
      await tx.wait(1);
      await nameExists(domain, 'polygon');
    });

    it('should register a TLD and pay with DWEB', async function () {
      const domain = chance.word({ syllables: 3 });
      const entry = {
        name: domain,
        duration: DURATION.ONE_YEAR
      };
      const commitment = await registrar.sendCommitment(entry, true);
      expect(commitment.status).to.be.equal('committed');
      expect(commitment.data).to.have.property('secret');
      expect(commitment.data).to.have.property('timestamp');
      await wait(60000);
      const tx = await registrar.register(commitment);
      await tx.wait(1);
      await nameExists(domain, 'polygon');
    });
  });
});
