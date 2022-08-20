# `toolkit`

## Initialization

```typescript
import {providers, Wallet} from "ethers";
import DwebToolkit, {ToolkitConfig} from "@decentraweb/toolkit";

const ETH_NETWORK = 'rinkeby';
const JSONRPC_URL = 'https://rinkeby.infura.io/v3/00000000000000000000000000000000';
const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const config: ToolkitConfig = {network: ETH_NETWORK, provider};
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

## Reading domain data

```typescript
const domain = await toolkit.domain('mauvis.eth');
if (domain) {
  const domainProvider = domain.provider;
  const ethAddress = await domain.address('ETH');
  const btcAddress = await domain.address('BTC');
  const contentHash = await domain.contentHash();
  const githubName = await domain.txt('com.github');
  const records = await domain.dns('A');
}
```

## Domain resolution logic
If domain ends with `.eth` then it is resolved through ENS. If domain has
one of the ICANN TLDs, then it is resolved through regular DNS. All other domains are resolved
with DWEB contracts.

List of ICANN domains can be found at https://data.iana.org/TLD/tlds-alpha-by-domain.txt and is
stored in `./icann_tlds.txt` file. It needs to be regulary updated.
