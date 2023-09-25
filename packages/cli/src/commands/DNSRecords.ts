import { DNSRecord, DWEBName, DWEBRegistry, Record, RecordSet } from '@decentraweb/core';
import prompts from 'prompts';
import chalk from 'chalk';
import { waitForTransaction } from '../utils/transaction';
import Command from './Command';

interface Item {
  record: DNSRecord;
  state: 'saved' | 'new' | 'deleted';
}

interface State {
  records: Item[];
}

const SUPPORTER_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'];

const FORMATTERS = {
  A: (record: Record.A) => `${record.type}\t${record.class}\t${record.data}`,
  AAAA: (record: Record.AAAA) => `${record.type}\t${record.class}\t${record.data}`,
  CNAME: (record: Record.CNAME) => `${record.type}\t${record.class}\t${record.data}`,
  MX: (record: Record.MX) =>
    `${record.type}\t${record.class}\t${record.data.preference} ${record.data.exchange}`,
  TXT: (record: Record.TXT) => `${record.type}\t${record.class}\t${record.data}`,
  UNKNOWN: (record: any) => `${record.type}\t${record.class}\t${record.data}`
};

class DNSRecords extends Command {
  private state: State;

  constructor(registry: DWEBRegistry, name: DWEBName) {
    super(registry, name);
    this.state = {
      records: []
    };
  }

  static recordToString(record: DNSRecord): string {
    switch (record.type) {
      case 'A':
        return FORMATTERS.A(record);
      case 'AAAA':
        return FORMATTERS.AAAA(record);
      case 'CNAME':
        return FORMATTERS.CNAME(record);
      case 'MX':
        return FORMATTERS.MX(record);
      case 'TXT':
        return FORMATTERS.TXT(record);
      default:
        return FORMATTERS.UNKNOWN(record);
    }
  }

  static async getDNSRecords(name: DWEBName): Promise<DNSRecord[]> {
    const records = [];
    for (const resource of SUPPORTER_TYPES) {
      const data = await name.getDNS(RecordSet.recordType.toType(resource));
      if (!data) continue;
      records.push(...RecordSet.decode(data));
    }
    return records;
  }

  async start(): Promise<void> {
    if (!(await this.name.hasResolver())) {
      return this.setResolver();
    }
    return this.readRecords();
  }

  async readRecords() {
    const records = await DNSRecords.getDNSRecords(this.name);
    this.state.records = records.map((r) => ({
      record: r,
      state: 'saved'
    }));
    return this.listRecords();
  }

  async listRecords(): Promise<void> {
    const lines: string[] = ['', chalk.bold(`DNS records in ${chalk.cyan(this.name.name)}:`)];
    let hasUnsaved = false;
    if (this.state.records.length) {
      this.state.records.forEach(({ record, state }) => {
        let line;
        switch (state) {
          case 'new':
            line = chalk.green('+ ' + DNSRecords.recordToString(record));
            hasUnsaved = true;
            break;
          case 'deleted':
            line = chalk.red('- ' + DNSRecords.recordToString(record));
            hasUnsaved = true;
            break;
          default:
            line = '  ' + DNSRecords.recordToString(record);
        }
        lines.push(line);
      });
    } else {
      lines.push(chalk.gray(`No DNS records found in "${this.name.name}"`));
    }

    process.stdout.write(lines.join('\n') + '\n\n');
    const choices = [
      { value: 'add', title: 'Add record', description: 'Add new record' },
      { value: 'delete', title: 'Delete record(s)', description: 'Delete one or more records' }
    ];
    if (hasUnsaved) {
      choices.push(
        { value: 'revert', title: 'Revert', description: 'Revert all unsaved changes' },
        { value: 'commit', title: 'Commit', description: 'Write changes to blockchain' }
      );
    }
    choices.push({ value: 'exit', title: 'Return', description: 'Exit DNS editing' });
    const { action } = await prompts([
      {
        type: 'select',
        name: 'action',
        message: 'What would you like to do?',
        choices,
        initial: 0
      }
    ]);

    switch (action) {
      case 'add':
        return this.add();
      case 'delete':
        return this.delete();
      case 'commit':
        return this.commit();
      case 'revert':
        return this.readRecords();
      default:
        return;
    }
  }

  async add() {
    const { recordType, ttl } = await prompts([
      {
        type: 'select',
        name: 'recordType',
        message: 'What would you like to do?',
        choices: [
          { value: 'A', title: 'A', description: 'Used to map domain name to an IPv4 address' },
          {
            value: 'AAAA',
            title: 'AAAA',
            description: 'Used to map domain name to an IPv6 address'
          },
          {
            value: 'CNAME',
            title: 'CNAME',
            description: 'An alias that points to another domain or subdomain'
          },
          {
            value: 'MX',
            title: 'MX',
            description: 'Uses mail servers to map where to deliver email for a domain'
          },
          {
            value: 'TXT',
            title: 'TXT',
            description: 'Allows administrators to add limited human and machine-readable notes'
          }
        ],
        initial: 0
      },
      {
        type: 'number',
        name: 'ttl',
        message: 'Enter record TTL in seconds?',
        initial: 3600,
        style: 'default',
        min: 300,
        max: 86400
      }
    ]);
    let record: DNSRecord;
    switch (recordType) {
      case 'A': {
        const { data } = await prompts([
          {
            type: 'text',
            name: 'data',
            message: 'Enter IPv4 address:'
          }
        ]);
        record = {
          name: this.name.name,
          type: 'A',
          ttl,
          class: 'IN',
          data
        };
        break;
      }
      case 'AAAA': {
        const { data } = await prompts([
          {
            type: 'text',
            name: 'data',
            message: 'Enter IPv6 address:'
          }
        ]);
        record = {
          name: this.name.name,
          type: 'AAAA',
          ttl,
          class: 'IN',
          data
        };
        break;
      }
      case 'CNAME': {
        const { data } = await prompts([
          {
            type: 'text',
            name: 'data',
            message: 'Target domain name:'
          }
        ]);
        record = {
          name: this.name.name,
          type: 'CNAME',
          ttl,
          class: 'IN',
          data
        };
        break;
      }
      case 'MX': {
        const { preference, exchange } = await prompts([
          {
            type: 'number',
            name: 'preference',
            message: 'Mail server priority:',
            min: 1
          },
          {
            type: 'text',
            name: 'exchange',
            message: 'Mail server domain name:'
          }
        ]);
        record = {
          name: this.name.name,
          type: 'MX',
          ttl,
          class: 'IN',
          data: {
            preference,
            exchange
          }
        };
        break;
      }

      default: {
        const { data } = await prompts([
          {
            type: 'text',
            name: 'data',
            message: 'Enter TXT record value:'
          }
        ]);
        record = {
          name: this.name.name,
          type: 'TXT',
          ttl,
          class: 'IN',
          data
        };
        break;
      }
    }
    this.state.records.push({ record, state: 'new' });
    this.state.records.sort((i1, i2) => {
      if (i1.record.type === i2.record.type) {
        if (i1.record.type === 'MX' && i2.record.type === 'MX') {
          return i1.record.data.preference > i2.record.data.preference ? 1 : -1;
        }
        return i1.record.data > i2.record.data ? 1 : -1;
      }
      const type1 = SUPPORTER_TYPES.indexOf(i1.record.type);
      const type2 = SUPPORTER_TYPES.indexOf(i2.record.type);
      return type1 > type2 ? 1 : -1;
    });
    return this.listRecords();
  }

  async delete() {
    const choices = this.state.records.map(({ record, state }, index) => ({
      value: index,
      title: DNSRecords.recordToString(record),
      selected: state === 'deleted'
    }));
    const { deleted } = await prompts([
      {
        type: 'multiselect',
        name: 'deleted',
        message: 'Mark records to delete',
        choices: choices,
        hint: '- Space to toggle. Return to submit'
      }
    ]);
    this.state.records = this.state.records.reduce((r: Item[], item, index) => {
      if (deleted.indexOf(index) === -1) {
        if (item.state === 'deleted') {
          r.push({
            state: 'saved',
            record: item.record
          });
        } else {
          r.push(item);
        }
      } else if (item.state !== 'new') {
        r.push({
          state: 'deleted',
          record: item.record
        });
      }
      return r;
    }, []);
    return this.listRecords();
  }

  async commit() {
    const lines = [chalk.bold('Following records will be written to blockchain:')];
    const typeStats = {
      deleted: {} as Record<string, boolean>,
      saved: {} as Record<string, boolean>
    };

    const records = this.state.records.reduce((r: DNSRecord[], item) => {
      if (item.state !== 'deleted') {
        r.push(item.record);
        lines.push(DNSRecords.recordToString(item.record));
        typeStats.saved[item.record.type] = true;
      } else {
        typeStats.deleted[item.record.type] = true;
      }
      return r;
    }, []);
    if (records.length) {
      process.stdout.write(lines.join('\n') + '\n');
    } else {
      process.stdout.write(chalk.red('DNS records will be cleared'));
    }
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message:
        'Do you want to write data to blockchain? Your wallet will be charged for this transaction.',
      initial: false
    });
    if (!confirmed) {
      return this.listRecords();
    }

    if (!records.length) {
      const res = await this.name.clearDNS();
      await waitForTransaction(res, 'Cleaning DNS Zone...');
    } else {
      //Detect if we need to clear zone. This happen when some type of records need to be removed completely
      const needCleanup = Object.keys(typeStats.deleted).some(
        (typeName) => !typeStats.saved[typeName]
      );
      if (needCleanup) {
        const res = await this.name.clearDNS();
        await waitForTransaction(res, 'Cleaning DNS Zone...');
      }
      const res = await this.name.setDNS(RecordSet.encode(records));
      await waitForTransaction(res, 'Writing DNS records to blockchain...');
    }

    return this.readRecords();
  }
}

export default DNSRecords;
