import * as dnsPacket from 'dns-packet';
import BaseDomain from './BaseDomain';
import { RecordType } from '@decentraweb/core';
import { ToolkitConfig } from '../types';
import dgram from 'dgram';

function getRandomReqId() {
  return Math.floor(Math.random() * 65534) + 1;
}

export class ICANNDomain extends BaseDomain {
  readonly provider = 'icann';
  private dnsServer: string;

  constructor(name: string, config: ToolkitConfig) {
    super(name, config);
    this.dnsServer = config.dnsServer || '8.8.8.8';
  }

  async address(coinId: string) {
    return null;
  }

  async contentHash() {
    return null;
  }

  async dns(recordType: RecordType) {
    return [];
  }

  async exists() {
    return true;
  }

  async txt(key: string): Promise<string | null> {
    return null;
  }

  async resolveICANN(domain: string, questionType: RecordType) {
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
    return answers || [];
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
