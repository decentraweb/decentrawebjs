import Command from "./Command";
import {DWEBName, DWEBRegistry} from "@decentraweb/core";
import prompts from "prompts";
import Contenthash from "./Contenthash";
import DNSRecords from "./DNSRecords";
import chalk from "chalk";


class NameMenu extends Command {
  constructor(registry: DWEBRegistry, name: DWEBName) {
    super(registry, name);
  }

  async start(): Promise<void> {
    await this.showSummary();
    return this.showMenu();
  }

  async showSummary() {
    this.writeln(chalk.bold(`Domain name ${chalk.cyan(this.name.name)}`))
    this.writeln(chalk.bold('Content:'))
    const contenthash = await this.name.getContenthash();
    if (contenthash) {
      this.writeln(contenthash)
    } else {
      this.writeln(chalk.gray('No content set'));
    }
    this.writeln('');
    this.writeln(chalk.bold('DNS records:'));
    const records = await DNSRecords.getDNSRecords(this.name);
    if (records.length) {
      records.forEach(record => this.writeln(DNSRecords.recordToString(record)));
    } else {
      this.writeln(chalk.gray('No DNS records set for name'));
    }
    this.writeln('');
  }

  async showMenu() {
    const {section} = await prompts([
      {
        type: 'select',
        name: 'section',
        message: 'What type of data you would like to edit?',
        choices: [
          {value: 'contenthash', title: 'Contenthash', description: 'Set contenthash'},
          {value: 'dns', title: 'DNS Records', description: "Manage DNS records"},
          {value: 'exit', title: 'Exit', description: "Exit CLI tool"}
        ],
        initial: 0
      }
    ]);
    switch (section) {
      case 'contenthash': {
        const contenthash = new Contenthash(this.registry, this.name);
        await contenthash.start();
        break;
      }
      case 'dns': {
        const dns = new DNSRecords(this.registry, this.name);
        await dns.start();
        break;
      }
      default:
        return;
    }
    return this.start();
  }
}

export default NameMenu;
