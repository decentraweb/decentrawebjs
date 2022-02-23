import {Buffer} from "buffer";
import {DWEBRegistry, RecordSet, DNSRecord} from "@decentraweb/core";
import dgram from "dgram";
import * as dnsPacket from "dns-packet";
import {providers} from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as punycode from "punycode/";
import {EthNetwork} from "./ens/base";
import ENS from "./ens/Ens";
import {getRandomReqId} from "./utils/dns";

const DNS_SERVER = '8.8.8.8'
const PORT = 53
const MAX_RECURSION_DEPTH = 3;
const ICANN_TLDS: Record<string, true> = fs.readFileSync(path.join(__dirname, '../../icann_tlds.txt'), 'utf-8')
  .split(/\s+/)
  .reduce((tlds: Record<string, true>, item: string) => {
    let tld = punycode.toUnicode(item.trim().toLowerCase());
    if (tld) {
      tlds[tld] = true;
    }
    return tlds;
  }, {});

function isReverseLookup(domain: string): boolean {
  return domain.replace(/\.$/, "").endsWith('in-addr.arpa')
}

function getTLD(name: string): string {
  return name.trim().toLowerCase().split('.').filter(s => !!s).pop() || '';
}

interface Logger {
  log(...mesages: string[]): void,

  flush(): void,
}

function createLogger(): Logger {
  const messageStack: string[] = [];
  const startTime = new Date
  let written = false;
  const logger = {
    log(...mesages: string[]) {
      messageStack.push(...mesages)
    },
    flush() {
      clearTimeout(timeout);
      messageStack.unshift(startTime.toUTCString(), `${Date.now() - startTime.getTime()}ms`)
      console.log(messageStack.join("\t"));
    }
  }
  const timeout = setTimeout(() => {
    if (!written) {
      logger.log('Not resolved within 5 seconds')
      logger.flush()
    }
  }, 5000)
  return logger;
}

export interface ResolverConfig {
  provider: providers.BaseProvider
  network: EthNetwork,
  ipfsGateway: {
    A: string[],
    AAAA: string[]
  }
}

class Resolver {
  protected ens: ENS;
  protected dweb: DWEBRegistry;
  protected options: ResolverConfig;

  constructor(options: ResolverConfig) {
    const {provider} = options;
    this.ens = new ENS({network: options.network, provider})
    this.dweb = new DWEBRegistry({network: 'rinkeby', provider})
    this.options = options;
  }

  async processRequest(data: Buffer): Promise<Buffer | null> {
    let request: dnsPacket.Packet
    try {
      request = dnsPacket.decode(data);
    } catch (e) {
      return null;
    }
    const logger = createLogger();

    if (!request?.questions?.length) {
      const responseData = this.createResponse(request, []);
      logger.log('No questions in request')
      logger.flush();
      return dnsPacket.encode(responseData)
    }
    const question: dnsPacket.Question = request.questions[0];
    const domain = punycode.toUnicode(question.name).toLowerCase();
    const questionType = question.type
    logger.log(question.type, domain);

    try {
      const tld = getTLD(domain);
      if (ICANN_TLDS[tld] && tld !== 'eth') {
        const result = await this.requestICANN(data);
        logger.log('Resolved with ICANN')
        logger.flush()
        return result;
      }
      const answers = await this.resolve(domain, questionType, logger)
      const responseData = this.createResponse(request, answers);
      logger.log(JSON.stringify(answers))
      logger.flush()
      return dnsPacket.encode(responseData)
    } catch (e) {
      console.error(e);
      logger.log('Failed to resolve:', e as string)
      logger.flush()
      return null;
    }
  }

  async resolve(domain: string, resourceType: dnsPacket.RecordType, logger: Logger, recursionLevel = 0): Promise<DNSRecord[]> {
    if (recursionLevel > MAX_RECURSION_DEPTH) {
      return [];
    }
    if (resourceType !== 'CNAME') {
      const [cname] = await this.resolve(domain, "CNAME", logger, recursionLevel + 1);
      if (cname) {
        return [
          cname,
          ...await this.resolve(cname.data as string, resourceType, logger, recursionLevel + 1)
        ];
      }
    }
    const tld = getTLD(domain);
    if (tld === 'eth') {
      return this.resolveENS(domain, resourceType)
    }
    if (ICANN_TLDS[tld]) {
      return this.resolveICANN(domain, resourceType);
    }
    return this.resolveDWEB(domain, resourceType);
  }

  async resolveICANN(domain: string, questionType: dnsPacket.RecordType): Promise<DNSRecord[]> {
    const request = dnsPacket.encode({
      type: 'query',
      id: getRandomReqId(),
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [{
        type: questionType,
        name: domain
      }]
    });

    const response = await this.requestICANN(request);
    const {answers} = dnsPacket.decode(response);
    return answers as DNSRecord[] || [];
  }

  async resolveDWEB(domain: string, questionType: dnsPacket.RecordType): Promise<DNSRecord[]> {
    if (questionType === 'TXT' && domain.startsWith('_dnslink.')) {
      return this.emulateDNSLink(domain);
    }
    if(domain.includes('_')){
      return [];
    }
    const name = this.dweb.name(domain)
    if (!await name.hasResolver()) {
      return [];
    }
    const records = await name.getDNS(RecordSet.recordType.toType(questionType));
    if (records?.length) {
      return RecordSet.decode(records)
    } else if (questionType === 'A' || questionType === 'AAAA') {
      const url = await name.getContenthash();
      if (url && /^\/?(ipfs|ipns)/.test(url)) {
        const gateways = this.options.ipfsGateway[questionType] || [];
        return gateways.map(address => ({
          name: domain,
          type: questionType,
          class: 'IN',
          ttl: 300,
          data: address
        }))
      }
    }
    return []
  }

  async resolveENS(domain: string, questionType: dnsPacket.RecordType): Promise<DNSRecord[]> {
    if (questionType === 'TXT' && domain.startsWith('_dnslink.')) {
      return this.emulateDNSLink(domain);
    }
    if(domain.includes('_')){
      return [];
    }
    const name = this.ens.name(domain)
    if (!await name.hasResolver()) {
      return [];
    }
    const records = await name.getDNS(RecordSet.recordType.toType(questionType));
    if (records?.length) {
      return RecordSet.decode(records)
    } else if (questionType === 'A' || questionType === 'AAAA') {
      const {contentType, value} = await name.getContent();
      if (contentType === 'contenthash' && value && /^\/?(ipfs|ipns)/.test(value)) {
        const gateways = this.options.ipfsGateway[questionType] || [];
        return gateways.map(address => ({
          name: domain,
          type: questionType,
          class: 'IN',
          ttl: 300,
          data: address
        }))
      }
    }
    return []
  }

  async emulateDNSLink(domain: string): Promise<DNSRecord[]> {
    const name = this.dweb.name(domain.replace(/^_dnslink./i, ''))
    if (!await name.hasResolver()) {
      return [];
    }
    const content = await name.getContenthash();
    if (!content) {
      return [];
    }
    const url = new URL(content)
    if (url.protocol !== 'ipfs:') {
      return [];
    }
    return [{
      name: domain,
      type: "TXT",
      class: "IN",
      data: `dnslink=/ipfs/${url.hostname}`,
      ttl: 3600
    }];
  }

  createResponse(request: dnsPacket.Packet, answers: DNSRecord[] = []): dnsPacket.Packet {
    return {
      ...request,
      type: 'response',
      answers: answers as dnsPacket.Answer[],
    }
  }

  requestICANN(request: Buffer): Promise<Buffer> {
    const client = dgram.createSocket('udp4');
    return new Promise((resolve, reject) => {
      client.once('message', function onMessage(message) {
        client.close();
        resolve(message);
      });
      client.once('error', function onError(err) {
        reject(err)
      });
      client.send(request, PORT, DNS_SERVER, err => err && reject(err));
    });
  }
}

export default Resolver
