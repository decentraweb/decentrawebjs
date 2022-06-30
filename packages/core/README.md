# Decentraweb Core library

This is a library for interacting with the Decentraweb smart contracts. It contains tools for resolving DNS, getting/setting records, and more. It contains Decentraweb's latest ABIs and can be used directly or embedded in other projects such as the Decentraweb Resolver and CLI.

## Usage
### Initialization
```typescript
import {providers, Wallet} from "ethers";
import {DWEBRegistry} from "@decentraweb/core";

const ETH_NETWORK = 'rinkeby';
const JSONRPC_URL = '';
const PKEY = ``;

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
//Signer only required if you want to write data to blockchain
const signer = new Wallet(PKEY, provider); 
const dweb = new DWEBRegistry({network: ETH_NETWORK, provider, signer});
```
### Address resolution
#### Get wallet address
```typescript
const name = dweb.name('test');
const addr = await name.getAddress('ETH');
```
#### Set wallet address
```typescript
const name = dweb.name('test');
const tx = await name.setAddress('ETH', '0x13BCb838DAEFF08f4E56237098dB1d814eeB837D');
//Optionally wait until first transaction confirmation
await tx.wait(1);
```

#### Reverse resolution
Set name for your address:
```typescript
const tx = await dweb.setReverseRecord('test');
//Optionally wait until first transaction confirmation
await tx.wait(1);
```
Get name for Ethereum address:
```typescript
const name = await dweb.getNameByAddress('0x13BCb838DAEFF08f4E56237098dB1d814eeB837D');
```


## Development
After monorepo is bootstrapped this package should have all dependencies installed and you can run:
- `npm run build` - to build production ready code
- `npm run watch` - to start compilation in watch mode
