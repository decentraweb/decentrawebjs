import { BigNumber, ethers, providers } from 'ethers';
import { normalizeDomainEntries, normalizeDuration } from '../utils';
import getRandomHex from '../../utils/getRandomHex';
import { TLDEntry } from '../types/TLD';
import { CommittedRegistration } from './types';
import { APPROVAL_TTL } from '../constants';
import signTypedData from '../../utils/signTypedData';
import { RegistrarConfig } from '../BaseRegistrar';
import { PolygonNetwork, Token } from '../../types/common';
import { getFeeTokenAddress, validateFeeToken } from '../../tokens';
import BaseTLDRegistrar from '../BaseTLDRegistrar';

interface Config extends RegistrarConfig {
  network: PolygonNetwork;
}

/**
 * Class that handles TLD registration on Polygon network.
 * Registration is done in 2 steps:
 * 1. Calling {@link sendCommitment} to get registration approval.
 * 2. Calling {@link register} to finish registration.
 * @example
 * ```ts
 * import { registration } from '@decentraweb/core';
 *
 * const registrar = new registration.PolygonTLDRegistrar({
 *   network: network as any,
 *   provider: provider,
 *   signer: signer
 * });
 *
 * const registration = await registrar.sendCommitment({ name: 'wallet', duration: registration.DURATION.ONE_YEAR });
 * const tx = await registrar.register(registration);
 * await tx.wait(1);
 * ```
 */
class PolygonTLDRegistrar extends BaseTLDRegistrar {
  readonly network: PolygonNetwork;

  constructor(options: Config) {
    super(options, 'RootRegistrarController');
    this.network = options.network;
  }

  /**
   * Step 1. Normalizes domain names, calls the API to check if they are available and returns approval for registration.
   * @param request - domain name and duration pairs
   * @param feeToken - token to be used for registration fee. Supported tokens WETH, DWEB, USDT, USDC. Default is MATIC
   * @param owner - ETH address of the owner of created subdomains, defaults to signer address
   */
  async sendCommitment(
    request: TLDEntry | Array<TLDEntry>,
    feeToken?: Token,
    owner?: string
  ): Promise<CommittedRegistration> {
    feeToken = validateFeeToken(this.network, feeToken);
    const feeTokenAddress = getFeeTokenAddress(this.network, feeToken);
    const entries = normalizeDomainEntries(request);
    const { error, safePrice } = await this.verifySignerBalance(entries, feeToken);
    if (error) {
      throw error;
    }
    const nameOwner = owner ? ethers.utils.getAddress(owner) : await this.signer.getAddress();
    const names = entries.map((e) => e.name);
    const secret = '0x' + getRandomHex(32);
    const hash = ethers.utils.solidityKeccak256(
      ['string', 'address', 'bytes32'],
      [names.join(','), nameOwner, secret]
    );
    const signature = await this.signer.signMessage(ethers.utils.arrayify(hash));

    const result = await this.api.sendPolygonTLDCommitment({
      feeTokenAddress,
      name: names,
      owner: nameOwner,
      secret,
      signature: signature
    });

    return {
      domains: entries,
      owner: nameOwner,
      expiresAt: new Date((result.timestamp + APPROVAL_TTL) * 1000),
      feeToken,
      feeTokenAddress,
      fee: safePrice,
      status: 'committed',
      data: {
        secret,
        timestamp: result.timestamp
      }
    };
  }

  /**
   * Step 2. Finish TLD registration. This step must be called 1 minute after `sendCommitment` step was completed.
   * @param request - data returned from `sendCommitment` step
   */
  async register(request: CommittedRegistration): Promise<providers.TransactionResponse> {
    const registrationPayload = {
      name: request.domains.map((e) => e.name),
      duration: request.domains.map((e) => e.duration),
      secret: request.data.secret,
      owner: request.owner,
      timestamp: request.data.timestamp,
      feeTokenAddress: request.feeTokenAddress,
      fee: request.fee.toString()
    };
    const typedData = await this.api.requestPolygonTLDRegistration(registrationPayload);
    const signature = await signTypedData(this.signer, typedData);
    const result = await this.api.submitPolygonTLDRegistration({
      ...registrationPayload,
      signature
    });
    return this.provider.getTransaction(result.txid);
  }
}

export default PolygonTLDRegistrar;
