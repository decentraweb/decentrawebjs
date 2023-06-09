# Decentraweb Core library

### Version 2 is in early development stage. **Please use [V1](https://www.npmjs.com/package/@decentraweb/core/v/1.2.1) for now.**

---

This is a library for interacting with the Decentraweb smart contracts. It contains tools for resolving DNS, getting/setting records, and more. It contains Decentraweb's latest ABIs and can be used directly or embedded in other projects such as the Decentraweb Resolver and CLI.

This library is using [ethers.js](https://docs.ethers.io/v5/) to interact with Ethereum blockchain. `ethers.js` is included as peer dependency, so don't forget to add it to your `package.json`

## Registering domain name
Domain name can be registered on Ethereum or Polygon networks. After registration, domain name will be available for
resolution on network where it was registered. Later owner can move domain name between networks.

### Registration fees
Registration fee can be paid either in ETH or DWEB tokens. If you want to pay in DWEB tokens, you need to allow
`RootRegistrarController` contract to spend tokens from your account. You can either approve amount enough to pay for
specific registration or approve unlimited amount.
#### Ethereum network
```typescript
import {ethers, providers, Wallet} from "ethers";
import {registration} from "@decentraweb/core";

const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new registration.EthereumTLDRegistrar({network: ETH_NETWORK, provider, signer});

//Approve usage of unlimited amount of DWEB tokens
registrar.approveDwebUsage().then((receipt)=>{
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});

//Approve usage for upt to 50 DWEB tokens
registrar.approveDwebUsageAmount(ethers.utils.parseEther('50')).then((receipt)=>{
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});
```
#### Polygon network
**WIP**

### Registering TLD on Ehthereum
Registration of TLD on Ethereum consists of three steps:
1. Getting approval from Decentraweb API
2. Submitting commitment to register domain name
3. Wait for 1 minute and submit registration transaction

Since process includes multiple steps it is recommended to save result of each step, to be able to resume registration
if it fails on some step (ie because of insufficient balance).
```typescript
import {ethers, providers, Wallet} from "ethers";
import {registration} from "@decentraweb/core";

const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new registration.EthereumTLDRegistrar({network: ETH_NETWORK, provider, signer});

async function wait(seconds: number) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function registerDomains(){
  const approvedRequest = await registrar.requestApproval([
    {name: 'foo', duration: registration.DURATION.ONE_YEAR},
    {name: 'bar', duration: registration.DURATION.ONE_YEAR},
    {name: '🙂🙂🙂', duration: registration.DURATION.ONE_YEAR}
  ]);
  const commitedRequest = await registrar.sendCommitment(approvedRequest);
  //Wait for 1 minute before registering domain name
  await wait(60);
  //If paying registration fee in ETH 
  const receipt = await registrar.register(commitedRequest);
  // If paying registration fee in DWEB tokens
  //const receipt = await registrar.register(commitedRequest, true);
  return receipt;  
}

registerDomains().then((receipt)=>{
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});
```



 

## Reading and writing domain records
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
