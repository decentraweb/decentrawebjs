import * as dnsPacket from 'dns-packet';
import BaseDomain from './BaseDomain';
import { RecordType } from '@decentraweb/core';
import dgram from 'dgram';
import { TxtAnswer } from 'dns-packet';

function getRandomReqId() {
  return Math.floor(Math.random() * 65534) + 1;
}

export class ICANNDomain extends BaseDomain {
  readonly provider = 'icann';
  readonly features = {
    address: false,
    contentHash: true,
    dns: true,
    txt: false
  };
  private dnsServer: string;

  constructor(name: string, dnsServer?: string) {
    super(name);
    this.dnsServer = dnsServer || '8.8.8.8';
  }

  async address(coinId: string) {
    return null;
  }

  async contentHash() {
    const domain = new ICANNDomain(`_dnslink.${this.name}`, this.dnsServer);
    const txtRecords = (await domain.dns('TXT')) as TxtAnswer[];
    const dnsLink = txtRecords.find((r) => r.data.toString().startsWith('dnslink='));
    if (!dnsLink) {
      return null;
    }
    const [protocol, hash] = dnsLink.data
      .toString()
      .replace(/^dnslink=\//i, '')
      .split('/');
    return protocol && hash ? `${protocol}://${hash}` : null;
  }

  async dns(recordType: RecordType) {
    const request = dnsPacket.encode({
      type: 'query',
      id: getRandomReqId(),
      flags: dnsPacket.RECURSION_DESIRED,
      questions: [
        {
          type: recordType,
          name: this.name
        }
      ]
    });
    const response = await this.requestICANN(request);
    const { answers } = dnsPacket.decode(response);
    answers?.forEach((a) => {
      if (a.type === 'TXT') {
        a.data = a.data.toString('utf-8');
      }
    });
    return answers || [];
  }

  async exists() {
    return true;
  }

  async txt(key: string): Promise<string | null> {
    return null;
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
      client.send(request, 53, this.dnsServer, (err) => err && reject(err));
    });
  }
}

export default ICANNDomain;
