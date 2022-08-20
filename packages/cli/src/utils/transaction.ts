import { providers } from 'ethers';
import chalk from 'chalk';

export async function waitForTransaction(response: providers.TransactionResponse, message = '') {
  process.stdout.write(chalk.cyan(message || 'Waiting for transaction to confirm...'));
  await response.wait(1);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
}
