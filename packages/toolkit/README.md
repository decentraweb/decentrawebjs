# `toolkit`

## Initialization
```typescript
import {providers, Wallet} from "ethers";
import DwebToolkit, {ToolkitConfig} from "@decentraweb/toolkit";

const ETH_NETWORK = 'rinkeby';
const JSONRPC_URL = 'https://rinkeby.infura.io/v3/00000000000000000000000000000000';
const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const config: ToolkitConfig = { network: ETH_NETWORK, provider };
const toolkit = new DwebToolkit(config);
```

## Ethereum address resolution

```typescript
const names = await toolkit.address.resolve('0x13BCb838DAEFF08f4E56237098dB1d814eeB837D');
/*
Returns:
[
  { provider: 'dweb', name: 'serhii' },
  { provider: 'ens', name: 'sergiy.eth' }
]
*/
const name = await toolkit.address.resolve('0x13BCb838DAEFF08f4E56237098dB1d814eeB837D', 'ens');
/*
Returns: 'sergiy.eth'
*/
const address = await toolkit.address.lookup('serhii');
/*
Returns: '0x13BCb838DAEFF08f4E56237098dB1d814eeB837D'
*/
```
