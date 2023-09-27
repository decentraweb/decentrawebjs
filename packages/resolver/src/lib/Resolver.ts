import { Buffer } from 'buffer';
import { DNSRecord } from '@decentraweb/core';
import DwebToolkit, { ApiProviderConfig, ToolkitConfig } from '@decentraweb/toolkit';
import dgram from 'dgram';
import * as dnsPacket from 'dns-packet';
import * as punycode from 'punycode/';

function getRandomReqId() {
  return Math.floor(Math.random() * 65534) + 1;
}

const DNS_SERVER = '8.8.8.8';
const PORT = 53;
const MAX_RECURSION_DEPTH = 3;

interface Logger {
  log(...mesages: string[]): void;

  flush(): void;
}

function createLogger(): Logger {
  const messageStack: string[] = [];
  const startTime = new Date();
  let written = false;
  const logger = {
    log(...mesages: string[]) {
      messageStack.push(...mesages);
    },
    flush() {
      clearTimeout(timeout);
      messageStack.unshift(startTime.toUTCString(), `${Date.now() - startTime.getTime()}ms`);
      console.log(messageStack.join('\t'));
    }
  };
  const timeout = setTimeout(() => {
    if (!written) {
      logger.log('Not resolved within 5 seconds');
      logger.flush();
    }
  }, 5000);
  return logger;
}

export interface ResolverConfig {
  blockchain: ToolkitConfig | ApiProviderConfig;
  ipfsGateway: {
    A: string[];
    AAAA: string[];
  };
}

export type DomainProvider = 'dweb' | 'ens' | 'icann';

class Resolver {
  protected options: ResolverConfig;
  protected toolkit: DwebToolkit;

  constructor(options: ResolverConfig) {
    this.options = options;
    this.toolkit = new DwebToolkit(this.options.blockchain);
  }

  async processRequest(data: Buffer): Promise<Buffer | null> {
    let request: dnsPacket.Packet;
    try {
      request = dnsPacket.decode(data);
    } catch (e) {
      return null;
    }
    const logger = createLogger();

    if (!request?.questions?.length) {
      const responseData = this.createResponse(request, []);
      logger.log('No questions in request');
      logger.flush();
      return dnsPacket.encode(responseData);
    }
    const question: dnsPacket.Question = request.questions[0];
    const domain = punycode.toUnicode(question.name).toLowerCase();
    const questionType = question.type;
    logger.log(question.type, domain);

    try {
      const answers = await this.resolve(domain, questionType, logger);
      const responseData = this.createResponse(request, answers);
      logger.log(JSON.stringify(answers));
      logger.flush();
      return dnsPacket.encode(responseData);
    } catch (e) {
      console.error(e);
      logger.log('Failed to resolve:', e as string);
      logger.flush();
      return null;
    }
  }

  async resolve(
    domain: string,
    resourceType: dnsPacket.RecordType,
    logger: Logger,
    recursionLevel = 0
  ): Promise<DNSRecord[]> {
    if (recursionLevel > MAX_RECURSION_DEPTH) {
      return [];
    }
    if (resourceType !== 'CNAME') {
      const [cname] = await this.resolve(domain, 'CNAME', logger, recursionLevel + 1);
      if (cname) {
        return [
          cname,
          ...(await this.resolve(cname.data as string, resourceType, logger, recursionLevel + 1))
        ];
      }
    }
    const provider = await this.toolkit.getDomainProvider(domain);
    console.log('resolve', domain, resourceType, 'provider', provider);
    switch (provider) {
      case 'ens':
      case 'dweb':
        return this.resolveBlockchain(domain, resourceType);
      case 'icann':
        return this.resolveICANN(domain, resourceType);
      default:
        throw new Error(`Unsupported domain provider: ${provider}`);
    }
  }

  async resolveICANN(domain: string, questionType: dnsPacket.RecordType): Promise<DNSRecord[]> {
    const request = dnsPacket.encode({
      type: 'query',
      id: getRandomReqId(),
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [
        {
          type: questionType,
          name: domain
        }
      ]
    });

    const response = await this.requestICANN(request);
    const { answers } = dnsPacket.decode(response);
    return (answers as DNSRecord[]) || [];
  }

  async resolveBlockchain(
    domain: string,
    questionType: dnsPacket.RecordType
  ): Promise<DNSRecord[]> {
    if (questionType === 'TXT' && domain.startsWith('_dnslink.')) {
      return this.emulateDNSLink(domain);
    }
    if (domain.includes('_')) {
      return [];
    }
    const name = await this.toolkit.domain(domain);
    console.log('name', name);
    if (!name) {
      return [];
    }
    const records = await name.dns(questionType);
    if (records?.length) {
      return records;
    } else if (questionType === 'A' || questionType === 'AAAA') {
      const url = await name.contentHash();
      if (url && /^\/?(ipfs|ipns)/.test(url)) {
        const gateways = this.options.ipfsGateway[questionType] || [];
        return gateways.map((address) => ({
          name: domain,
          type: questionType,
          class: 'IN',
          ttl: 300,
          data: address
        }));
      }
    }
    return [];
  }

  async emulateDNSLink(domain: string): Promise<DNSRecord[]> {
    const name = await this.toolkit.domain(domain.replace(/^_dnslink./i, ''));
    if (!name) {
      return [];
    }
    const content = await name.contentHash();
    if (!content) {
      return [];
    }
    const url = new URL(content);
    const protocol = url.protocol.slice(0, -1);
    if (protocol !== 'ipfs' && protocol !== 'ipns') {
      return [];
    }
    return [
      {
        name: domain,
        type: 'TXT',
        class: 'IN',
        data: `dnslink=/${protocol}/${url.hostname}`,
        ttl: 3600
      }
    ];
  }

  createResponse(request: dnsPacket.Packet, answers: DNSRecord[] = []): dnsPacket.Packet {
    return {
      ...request,
      type: 'response',
      answers: answers as dnsPacket.Answer[]
    };
  }

  requestICANN(request: Buffer): Promise<Buffer> {
    const client = dgram.createSocket('udp4');
    return new Promise((resolve, reject) => {
      client.once('message', function onMessage(message) {
        client.close();
        resolve(message);
      });
      client.once('error', function onError(err) {
        reject(err);
      });
      client.send(request, PORT, DNS_SERVER, (err) => err && reject(err));
    });
  }
}

export default Resolver;
