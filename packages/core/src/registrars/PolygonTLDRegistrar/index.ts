import {BigNumber, ethers, providers} from 'ethers';
import { normalizeDomainEntries, normalizeDuration, normalizeName } from '../utils';
import getRandomHex from '../../utils/getRandomHex';
import { BalanceVerificationResult, DomainEntry } from '../types/TLD';
import { increaseByPercent } from '../../utils/misc';
import { CommittedRegistration } from './types';
import { APPROVAL_TTL } from '../constants';
import signTypedData from '../../utils/signTypedData';
import BaseRegistrar, {RegistrarConfig} from '../BaseRegistrar';
import {PolygonNetwork} from "../../contracts/interfaces";
import {getWethContract} from "../../contracts";

interface Config extends RegistrarConfig {
  network: PolygonNetwork;
}

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
    request: DomainEntry | Array<DomainEntry>,
    isFeesInDweb: boolean = false,
    owner?: string
  ): Promise<CommittedRegistration> {
    const entries = normalizeDomainEntries(request);
    const { error, safePrice } = await this.verifySignerBalance(entries, isFeesInDweb);
    if (error) {
      throw new Error(error);
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

  async verifySignerBalance(
    request: DomainEntry | Array<DomainEntry>,
    isFeesInDweb: boolean = false
  ): Promise<BalanceVerificationResult> {
    const requests = normalizeDomainEntries(request);
    const signerAddress = await this.signer.getAddress();
    const contract = isFeesInDweb ? this.dwebToken : this.wethToken;
    const [balance, allowance, rentPrice] = await Promise.all([
      contract.balanceOf(signerAddress),
      contract.allowance(signerAddress, this.contract.address),
      this.getRentPriceBatch(requests, isFeesInDweb)
    ]);
    const safePrice = increaseByPercent(rentPrice, 10);
    const result: BalanceVerificationResult = {
      success: true,
      error: null,
      price: rentPrice,
      safePrice,
      currency: isFeesInDweb ? 'DWEB' : 'WETH'
    };

    if (balance.lt(safePrice)) {
      result.success = false;
      result.error = `Insufficient ${result.currency} balance. ${safePrice} wei needed, ${balance} wei found.`;
    }
    if (allowance.lt(safePrice)) {
      result.success = false;
      result.error = `Insufficient ${result.currency} allowance. ${safePrice} wei needed, ${allowance} wei approved.`;
    }
    return result;
  }

  /**
   * Returns the price of registration in wei
   * @param {DomainEntry} entry - domain name and duration
   * @param {boolean} isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   * @returns {Promise<BigNumber>} - amount in wei
   */
  async getRentPrice(
    { name, duration }: DomainEntry,
    isFeesInDweb: boolean = false
  ): Promise<BigNumber> {
    const tokenAddress = isFeesInDweb ? this.dwebToken.address : this.wethToken.address;
    return this.contract.rentPrice(normalizeName(name), normalizeDuration(duration), tokenAddress);
  }

  /**
   * Returns the price of registration in wei for multiple domains
   * @param {Array<DomainEntry>} requests - array of domain names and durations
   * @param {boolean} isFeesInDweb - if true, registration fee will be paid in DWEB tokens, otherwise in ETH
   * @returns {Promise<BigNumber>} - total amount in wei
   */
  async getRentPriceBatch(requests: Array<DomainEntry>, isFeesInDweb: boolean): Promise<BigNumber> {
    let totalPrice = BigNumber.from(0);
    for (const name of requests) {
      const price = await this.getRentPrice(name, isFeesInDweb);
      totalPrice = totalPrice.add(price);
    }
    return totalPrice;
  }
}

export default PolygonTLDRegistrar;
