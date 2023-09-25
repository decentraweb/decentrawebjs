import { contentHash, DWEBName, DWEBRegistry } from '@decentraweb/core';
import prompts from 'prompts';
import chalk from 'chalk';
import Command from './Command';
import { waitForTransaction } from '../utils/transaction';

interface State {
  contenthash: string;
}

class Contenthash extends Command {
  private state: State;

  constructor(registry: DWEBRegistry, name: DWEBName) {
    super(registry, name);
    this.state = {
      contenthash: ''
    };
  }

  async start(): Promise<void> {
    if (!(await this.name.hasResolver())) {
      return this.setResolver();
    }
    return this.readContent();
  }

  async readContent(): Promise<void> {
    this.state.contenthash = (await this.name.getContenthash()) || '';
    return this.showCurrent();
  }

  async showCurrent(): Promise<void> {
    this.writeln(chalk.bold(`Current content set for "${this.name.name}":`));
    if (this.state.contenthash) {
      this.writeln(chalk.cyan(this.state.contenthash));
    } else {
      this.writeln(chalk.gray(chalk.italic('none')));
    }
    const choices = [];
    if (this.state.contenthash) {
      choices.push(
        { value: 'edit', title: 'Edit', description: 'Change URL' },
        { value: 'remove', title: 'Remove', description: 'Remove URL' }
      );
    } else {
      choices.push({ value: 'edit', title: 'Add', description: 'Set content URL' });
    }
    choices.push({ value: 'exit', title: 'Return', description: 'Return to initial screen' });

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: choices,
      initial: 0
    });
    switch (action) {
      case 'edit':
        return this.showPrompt();
      case 'remove':
        this.state.contenthash = '';
        return this.commit();
    }
  }

  async showPrompt(): Promise<void> {
    const { contenthash } = await prompts([
      {
        type: 'text',
        name: 'contenthash',
        message: 'Content URL:',
        initial: this.state.contenthash
      }
    ]);

    if (contenthash) {
      let encoded = null;
      try {
        encoded = contentHash.encode(contenthash);
      } catch (e) {}
      if (!encoded) {
        this.writeln(chalk.red('Invalid content URL'));
        return this.showPrompt();
      }
    }

    if (contenthash !== this.state.contenthash) {
      this.state.contenthash = contenthash;
      return this.commit();
    }
    return this.showCurrent();
  }

  async commit(): Promise<void> {
    const { confirmed } = await prompts({
      type: 'confirm',
      name: 'confirmed',
      message:
        'Do you want to write data to blockchain? Your wallet will be charged for this transaction.',
      initial: false
    });
    if (!confirmed) {
      return this.readContent();
    }
    const res = await this.name.setContenthash(this.state.contenthash);
    await waitForTransaction(res);
    return this.readContent();
  }
}

export default Contenthash;
