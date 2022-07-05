# Decentraweb Core library

This is a library for interacting with the Decentraweb smart contracts. It contains tools for resolving DNS, getting/setting records, and more. It contains Decentraweb's latest ABIs and can be used directly or embedded in other projects such as the Decentraweb Resolver and CLI.

This library is using [ethers.js](https://docs.ethers.io/v5/) to interact with Ethereum blockchain. `ethers.js` is included as peer dependency, so don't forget to add it to your `package.json`

## Usage
### Initialization
```typescript
import {providers, Wallet} from "ethers";
import {DWEBRegistry} from "@decentraweb/core";

const ETH_NETWORK = 'rinkeby';
const JSONRPC_URL = '';
const PRIVATE_KEY = '';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
//Signer only required if you want to write data to blockchain
const signer = new Wallet(PRIVATE_KEY, provider); 
const contracts = {
  "DWEBRegistry": "0x8eb93AB94A6Afa8d416aB1884Ebb5A3f00920a7A",
  "DefaultReverseResolver": "0x7d770Cfe9608Ff3AA3F5A34bdCd27c3870a370Da",
  "PublicResolver": "0xf157D3559DF1F8c69cb757A1A2cdF8736618E083",
  "ReverseRegistrar": "0x3D8f878584199e47a2d40A1E269042E10aa50754"
}
const dweb = new DWEBRegistry({network: ETH_NETWORK, provider, signer, contracts});
```
Parameters:
1. `network` (required) - Ethereum network name. Only `rinkeby` and `mainnet` supported currently.
2. `provider` (required) - [ethers Provider](https://docs.ethers.io/v5/api/providers/provider/) instance to read blockchain data.
3. `signer` (optional) - [ethers Signer](https://docs.ethers.io/v5/api/signer/) instance. Only required if you need to write data to blockchain.
4. `contracts` (optional) - used to override default Decentraweb contract addresses. Only needs to be used for development purposes.

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
const name = await dweb.getReverseRecord('0x13BCb838DAEFF08f4E56237098dB1d814eeB837D');
```


## Development
After monorepo is bootstrapped this package should have all dependencies installed and you can run:
- `npm run build` - to build production ready code
- `npm run watch` - to start compilation in watch mode
