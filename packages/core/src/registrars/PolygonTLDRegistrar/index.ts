import DwebContractWrapper from '../../DwebContractWrapper';
import {BigNumber, ethers, providers, Wallet} from 'ethers';
import { getContract, getWethContract } from '../../contracts';
import { RegistrarConfig } from '../EthereumRegistrar';
import PolygonApi from '../../PolygonAPI';
import { normalizeDomainEntries, normalizeDuration, normalizeName } from '../utils';
import getRandomHex from '../../utils/getRandomHex';
import { BalanceVerificationResult, DomainEntry } from '../types';
import { PolygonNetwork } from '../../contracts/interfaces';
import { increaseByPercent } from '../../utils/misc';
import { CommittedRegistration, DoneRegistration } from './types';
import { APPROVAL_TTL } from '../constants';
import signTypedData from '../../utils/signTypedData';

interface PolygonRegistrarConfig extends RegistrarConfig {
  network: PolygonNetwork;
}

class PolygonTLDRegistrar extends DwebContractWrapper {
  readonly network: PolygonNetwork;
  readonly api: PolygonApi;
  readonly signer: Wallet;
  readonly dwebToken: ethers.Contract;
  readonly wethToken: ethers.Contract;

  constructor(options: PolygonRegistrarConfig) {
    super(options, 'RootRegistrarController');
    this.network = options.network;
    this.api = new PolygonApi(this.network);
    this.signer = options.signer;
    this.dwebToken = getContract({
      address: this.contractConfig.DecentraWebToken,
      name: 'DecentraWebToken',
      provider: this.signer,
      network: this.network
    });
    this.wethToken = getWethContract(this.network, this.signer);
  }

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

    const result = await this.api.sendTLDCommitment({
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

  async register(request: CommittedRegistration): Promise<DoneRegistration> {
    const registrationPayload = {
      name: request.domains.map((e) => e.name),
      duration: request.domains.map((e) => e.duration),
      secret: request.data.secret,
      owner: request.owner,
      timestamp: request.data.timestamp,
      feeTokenAddress: request.isFeesInDweb ? this.dwebToken.address : this.wethToken.address,
      fee: request.fee.toString()
    };
    const typedData = await this.api.requestTLDRegistration(registrationPayload);
    const signature = await signTypedData(this.signer, typedData);
    const result = await this.api.submitTLDRegistration({
      ...registrationPayload,
      signature
    });
    return {
      domains: request.domains,
      owner: request.owner,
      expiresAt: request.expiresAt,
      isFeesInDweb: request.isFeesInDweb,
      fee: request.fee,
      status: 'done',
      data: {
        txid: result.txid
      }
    };
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

  /**
   * Approve the DWEB token amount that can be used by the registrar
   * @param {'WETH' | 'DWEB'} token - token name
   * @param {BigNumber} amount - amount in wei
   * @returns {Promise<providers.TransactionReceipt>}
   */
  async setTokenAllowance(
    token: 'WETH' | 'DWEB',
    amount: BigNumber
  ): Promise<providers.TransactionReceipt> {
    switch (token) {
      case 'DWEB': {
        const tx = await this.dwebToken.approve(this.contract.address, amount, {
          value: '0x00'
        });
        return tx.wait(1);
      }
      case 'WETH': {
        const tx = await this.wethToken.approve(this.contract.address, amount, {
          value: '0x00'
        });
        return tx.wait(1);
      }
    }
  }

  /**
   * Approve unlimited token usage by the registrar, so no further approvals are needed
   */
  async allowTokenUsage(token: 'WETH' | 'DWEB') {
    return this.setTokenAllowance(
      token,
      ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), 'ether')
    );
  }
}

export default PolygonTLDRegistrar;
