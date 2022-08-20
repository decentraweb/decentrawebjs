import { DWEBName, DWEBRegistry } from '@decentraweb/core';
import prompts from 'prompts';
import { waitForTransaction } from '../utils/transaction';

abstract class Command {
  readonly registry: DWEBRegistry;
  readonly name: DWEBName;

  constructor(registry: DWEBRegistry, name: DWEBName) {
    this.registry = registry;
    this.name = name;
  }

  abstract start(): Promise<void>;

  async setResolver(): Promise<void> {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message:
        'It seems that no resolver is associated with this domain. Would you like to use default Decentraweb resolver?',
      initial: true
    });
    if (!confirmed) {
      return;
    }
    const res = await this.registry.assignDefaultResolver(this.name.name);
    await waitForTransaction(res);
    return this.start();
  }

  write(text: string): void {
    process.stdout.write(text);
  }

  writeln(text: string): void {
    process.stdout.write(text + '\n');
  }
}

export default Command;
