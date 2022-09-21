# Decentraweb Core library

This is a library for interacting with the Decentraweb smart contracts. It contains tools for resolving DNS, getting/setting records, and more. It contains Decentraweb's latest ABIs and can be used directly or embedded in other projects such as the Decentraweb Resolver and CLI.

This library is using [ethers.js](https://docs.ethers.io/v5/) to interact with Ethereum blockchain. `ethers.js` is included as peer dependency, so don't forget to add it to your `package.json`

## Usage
### Initialization
```typescript
import {providers, Wallet} from "ethers";
import {DWEBRegistry} from "@decentraweb/core";

const ETH_NETWORK = 'goerli';
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
1. `network` (required) - Ethereum network name. Only `goerli` and `mainnet` supported currently.
2. `provider` (required) - [ethers Provider](https://docs.ethers.io/v5/api/providers/provider/) instance to read blockchain data.
3. `signer` (optional) - [ethers Signer](https://docs.ethers.io/v5/api/signer/) instance. Only required if you need to write data to blockchain.
4. `contracts` (optional) - used to override default Decentraweb contract addresses. Only needs to be used for development purposes.

#### Browser bundle
In most cases importing library using `npm` is preferred way, but for fast prototyping you can load it from our CND:
```html
<script src="https://cdn.ethers.io/lib/ethers-5.7.umd.min.js" type="application/javascript"></script>
<script src="https://cdn.decentraweb.org/decentraweb-core-1.2.0.min.js" type="application/javascript"></script>
<script>
  window.addEventListener('load', () => {
    const {DWEBRegistry} = Decentraweb;
    const dweb = new DWEBRegistry({network: 'goerli', provider: ethers.getDefaultProvider('goerli')});
    const name = dweb.name('some_dweb_name');
  })
</script>
```


### Writing data to blockchain
As it was stated above, a valid signer instance must be provided to enable writing data to blockchain.

All write operations return instance of ethers.js [TransactionResponse](https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse) class.
You can call `transaction.wait(n)` to wait until transaction get `n` confirmations.

### Address resolution
Decentraweb domain supports setting wallet addresses for multiple cryptocurrencies. Decentraweb is compatible with
ENS ([EIP-2304](https://eips.ethereum.org/EIPS/eip-2304)) and uses [@ensdomains/address-encoder](https://www.npmjs.com/package/@ensdomains/address-encoder) package to encode/decode wallet addresses.

Full list of supported cryptocurrencies can be found in [@ensdomains/address-encoder](https://www.npmjs.com/package/@ensdomains/address-encoder) documentation.

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
Reverse address resolution is only possible for Ethereum wallets. To enable reverse resolution for your wallet et name for your address:
```typescript
const tx = await dweb.setReverseRecord('foobar');
//Optionally wait until first transaction confirmation
await tx.wait(1);
```
This will set name "foobar" for the wallet address that was used to sign this transaction. 

To resolve Ethereum address to name use following method:
```typescript
const name = await dweb.getReverseRecord('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
```
By default `getReverseRecord` also performing forward check. This mean that after finding name by address, it will also
check that found name is owned by given address. To resolve address without this check, pass `true` as second argument:
```typescript
const name = await dweb.getReverseRecord('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', true);
```

### Content Hash
Decentraweb domains support storing content hash. This feature is following ENS [EIP-1577](https://eips.ethereum.org/EIPS/eip-1577) standard.
Supported content hash URL formats:
```
    (ipfs|ipns|bzz|onion|onion3)://{hash}
    /(ipfs|ipns)/{hash}
```
#### Set content URL
```typescript
const name = dweb.name('test');
const tx = await name.setContenthash('ipfs://bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze');
//Optionally wait until first transaction confirmation
await tx.wait(1);
```
#### Get content URL
```typescript
const name = dweb.name('test');
const contentURL = await name.getContenthash();
```
### Text records
Text records allow domain owner to store simple key-value string data in domain. To remove text record simply set it to empty string.
#### Set text record
```typescript
const name = dweb.name('test');
const tx = await name.setText('email', 'foo@acme.com');
//Optionally wait until first transaction confirmation
await tx.wait(1);
```
#### Get text record
```typescript
const name = dweb.name('test');
const email = await name.getText('email');
```

### DNS records
DNS records are stored in binary format known as DNS Wireformat. This library utilize [dns-packet](https://www.npmjs.com/package/dns-packet)
package to encode/decode DNS data. This library exports `RecordSet` utility class to help with encoding/decoding.
#### Setting DNS records
```typescript
import {DWEBRegistry, RecordSet} from "@decentraweb/core";

const name = dweb.name('test');
const data = RecordSet.encode([
  {
    type: 'A',
    name: 'test',
    ttl: 3600,
    class: 'IN',
    data: '192.168.0.1'
  },
  {
    type: "TXT",
    name: 'test',
    ttl: 3600,
    class: 'IN',
    data: 'this is TXT value'
  }
]);
const tx = await name.setDNS(data);
//Optionally wait until first transaction confirmation
await tx.wait(1);
```
#### Reading DNS records
```typescript
import {DWEBRegistry, RecordSet} from "@decentraweb/core";

const name = dweb.name('test');
const data = await name.getDNS(RecordSet.recordType.toType('A'));
const aRecords = RecordSet.decode(data);
```

## Development
After monorepo is bootstrapped this package should have all dependencies installed and you can run:
- `npm run build` - to build production ready code
- `npm run watch` - to start compilation in watch mode
