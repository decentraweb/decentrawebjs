import { BigNumber, ethers, providers } from 'ethers';
import { normalizeDomainEntries, normalizeDuration } from '../utils';
import getRandomHex from '../../utils/getRandomHex';
import { TLDBalanceVerificationResult, TLDEntry } from '../types/TLD';
import { increaseByPercent } from '../../utils/misc';
import { CommittedRegistration } from './types';
import { APPROVAL_TTL } from '../constants';
import signTypedData from '../../utils/signTypedData';
import BaseRegistrar, { RegistrarConfig } from '../BaseRegistrar';
import { getWethContract } from '../../contracts';
import { PolygonNetwork } from '../../types/common';
import { normalizeName } from '../../utils';
import { InsufficientAllowanceError, InsufficientBalanceError } from '../../errors';

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
class PolygonTLDRegistrar extends BaseRegistrar {
  readonly network: PolygonNetwork;
  readonly wethToken: ethers.Contract;

  constructor(options: Config) {
    super(options);
    this.network = options.network;
    this.wethToken = getWethContract(this.network, this.signer);
  }

  /**
   * Step 1. Normalizes domain names, calls the API to check if they are available and returns approval for registration.
   * @param request - domain name and duration pairs
   * @param isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in WETH
   * @param owner - ETH address of the owner of created subdomains, defaults to signer address
   */
  async sendCommitment(
    request: TLDEntry | Array<TLDEntry>,
    isFeesInDweb: boolean = false,
    owner?: string
  ): Promise<CommittedRegistration> {
    const entries = normalizeDomainEntries(request);
    const { error, safePrice } = await this.verifySignerBalance(entries, isFeesInDweb);
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
      name: names,
      owner: nameOwner,
      secret,
      signature: signature
    });

    return {
      domains: entries,
      owner: nameOwner,
      expiresAt: new Date((result.timestamp + APPROVAL_TTL) * 1000),
      isFeesInDweb,
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
      feeTokenAddress: request.isFeesInDweb ? this.dwebToken.address : this.wethToken.address,
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

  /** {@inheritDoc EthereumTLDRegistrar.verifySignerBalance} */
  async verifySignerBalance(
    request: TLDEntry | Array<TLDEntry>,
    isFeesInDweb: boolean = false
  ): Promise<TLDBalanceVerificationResult> {
    const requests = normalizeDomainEntries(request);
    const signerAddress = await this.signer.getAddress();
    const contract = isFeesInDweb ? this.dwebToken : this.wethToken;
    const [balance, allowance, rentPrice] = await Promise.all([
      contract.balanceOf(signerAddress),
      contract.allowance(signerAddress, this.contract.address),
      this.getRentPriceBatch(requests, isFeesInDweb)
    ]);
    const safePrice = increaseByPercent(rentPrice, 10);
    const result: TLDBalanceVerificationResult = {
      success: true,
      error: null,
      price: rentPrice,
      safePrice,
      currency: isFeesInDweb ? 'DWEB' : 'WETH'
    };

    if (balance.lt(safePrice)) {
      result.success = false;
      result.error = new InsufficientBalanceError(balance, safePrice, result.currency);
    }
    if (allowance.lt(safePrice)) {
      result.success = false;
      result.error = new InsufficientAllowanceError(allowance, safePrice, result.currency);
    }
    return result;
  }

  /**
   * Returns the price of registration in wei
   * @param {TLDEntry} entry - domain name and duration
   * @param {boolean} isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in WETH
   * @returns {Promise<BigNumber>} - amount in wei
   */
  async getRentPrice(
    { name, duration }: TLDEntry,
    isFeesInDweb: boolean = false
  ): Promise<BigNumber> {
    const tokenAddress = isFeesInDweb ? this.dwebToken.address : this.wethToken.address;
    return this.contract.rentPrice(normalizeName(name), normalizeDuration(duration), tokenAddress);
  }

  /**
   * Returns the price of registration in wei for multiple domains
   * @param {Array<TLDEntry>} requests - array of domain names and durations
   * @param {boolean} isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in WETH
   * @returns {Promise<BigNumber>} - total amount in wei
   */
  async getRentPriceBatch(requests: Array<TLDEntry>, isFeesInDweb: boolean): Promise<BigNumber> {
    let totalPrice = BigNumber.from(0);
    for (const name of requests) {
      const price = await this.getRentPrice(name, isFeesInDweb);
      totalPrice = totalPrice.add(price);
    }
    return totalPrice;
  }
}

export default PolygonTLDRegistrar;
