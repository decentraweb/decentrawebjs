#!/usr/bin/env node
import {ethers} from 'ethers';
import prompts from 'prompts';
import {DWEBRegistry} from "@decentraweb/core";
import NameMenu from "./commands/NameMenu";
import chalk from "chalk";

let PKEY: string;
let PROVIDER: ethers.providers.BaseProvider;

async function showMenu(): Promise<void> {
  if(!PROVIDER){
    const {projectId} = await prompts([
      {
        type: 'text',
        name: 'projectId',
        message: `Enter Infura project id (otherwise API access may be slow)`
      }
    ]);
    if(projectId){
      PROVIDER = new ethers.providers.InfuraProvider('rinkeby', projectId)
    } else {
      PROVIDER = ethers.getDefaultProvider('rinkeby');
    }
    //Test that provider works
    await PROVIDER.getBlockNumber();
  }

  if(!PKEY){
    const {pkey} = await prompts([
      {
        type: 'password',
        name: 'pkey',
        message: `Enter your wallet private key (we won't store it anywhere)`
      }
    ]);
    PKEY = pkey;
  }
  if(!PKEY){
    return ;
  }
  const signer = new ethers.Wallet(PKEY, PROVIDER);
  const {domain} = await prompts([
    {
      type: 'text',
      name: 'domain',
      message: `Enter domain you would like to manage?`
    },
  ]);
  if (!domain) {
    return;
  }
  const registry = new DWEBRegistry({network: 'rinkeby', provider: PROVIDER, signer})
  const name = registry.name(domain);
  const ownerAddress = await name.getOwner();
  if (ownerAddress !== signer.address) {
    process.stdout.write(chalk.red('Provided private key does not belong to domain owner'));
    return showMenu();
  }
  const menu = new NameMenu(registry, name);
  await menu.start();
  return showMenu();
}

showMenu().then(() => {
  setTimeout(() => process.exit(0), 1000)
}).catch((e) => {
  console.log(e.stack)
  setTimeout(() => process.exit(1), 1000)
});
