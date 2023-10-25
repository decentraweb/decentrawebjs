# Decentraweb Core library

This is a library for interacting with the Decentraweb smart contracts. It contains tools for resolving DNS, getting/setting records, and more. It contains Decentraweb's latest ABIs and can be used directly or embedded in other projects such as the Decentraweb Resolver and CLI.

This library is using [ethers.js](https://docs.ethers.io/v5/) to interact with Ethereum blockchain. `ethers.js` is included as peer dependency, so don't forget to add it to your `package.json`

## Installation and initialization
To install library run `npm install --save @decentraweb/core ethers@5` in your project directory.

Then you can initialize Decentraweb instance to read/write domain records:
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
1. `network` (required) - Ethereum network name (`mainnet`, `goerli`, `matic`, `maticmum`)
2. `provider` (required) - [ethers Provider](https://docs.ethers.io/v5/api/providers/provider/) instance to read blockchain data.
3. `signer` (optional) - [ethers Signer](https://docs.ethers.io/v5/api/signer/) instance. Only required if you want to write data to blockchain.
4. `contracts` (optional) - used to override default Decentraweb contract addresses. Only needs to be used for development purposes.

### Browser bundle
In most cases importing library using `npm` is preferred way, but for fast prototyping you can load it from our CND:
```html
<script src="https://cdn.ethers.io/lib/ethers-5.7.umd.min.js" type="application/javascript"></script>
<script src="https://cdn.decentraweb.org/decentraweb-core-2.0.0.min.js" type="application/javascript"></script>
<script>
  window.addEventListener('load', () => {
    const {DWEBRegistry} = Decentraweb;
    const dweb = new DWEBRegistry({network: 'goerli', provider: ethers.getDefaultProvider('goerli')});
    const name = dweb.name('some_dweb_name');
  })
</script>
```

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
import {registrars} from "@decentraweb/core";

const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new registrars.EthereumTLDRegistrar({network: ETH_NETWORK, provider, signer});

//Approve usage of unlimited amount of DWEB tokens
registrar.allowTokenUsage('DWEB').then((receipt) => {
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});

//Approve usage for up to 50 DWEB tokens
registrar.setTokenAllowance('DWEB', ethers.utils.parseEther('50')).then((receipt) => {
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});
```
#### Polygon network
On Polygon network registration fees are paid either in DWEB or Wrapped Ether (WETH) tokens. Both tokens require approval
to be used by `RootRegistrarController` contract.
```typescript
import {ethers, providers, Wallet} from "ethers";
import {registrars} from "@decentraweb/core";

const ETH_NETWORK = 'matic';
const JSONRPC_URL = 'https://matic.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new registrars.PolygonTLDRegistrar({network: ETH_NETWORK, provider, signer});

//Approve usage of unlimited amount of DWEB tokens
registrar.allowTokenUsage('WETH').then((receipt) => {
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});

//Approve usage for up to 50 DWEB tokens
registrar.setTokenAllowance('WETH', ethers.utils.parseEther('50')).then((receipt) => {
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});
```

### Registering TLD on Ehthereum
Registration of TLD on Ethereum consists of three steps:
1. Getting approval from Decentraweb API
2. Submitting commitment to register domain name
3. Wait for 1 minute and submit registration transaction

Since process includes multiple steps it is recommended to save result of each step, to be able to resume registration
if it fails on some step (ie because of insufficient balance).
```typescript
import {ethers, providers, Wallet} from "ethers";
import {registrars} from "@decentraweb/core";


const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new registrars.EthereumTLDRegistrar({network: ETH_NETWORK, provider, signer});

async function wait(seconds: number) {
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function registerDomains(){
  const approvedRequest = await registrar.requestApproval([
    {name: 'foo', duration: registrars.DURATION.ONE_YEAR},
    {name: 'bar', duration: registrars.DURATION.ONE_YEAR},
    {name: '🙂🙂🙂', duration: registrars.DURATION.ONE_YEAR}
  ]);
  const commitedRequest = await registrar.sendCommitment(approvedRequest);
  //Wait for 1st confirmation of commitment transaction
  await commitedRequest.tx.wait(1);
  //Wait for 1 minute before registering domain name
  await wait(60);
  //If paying registration fee in ETH 
  const tx = await registrar.register(commitedRequest);
  // If paying registration fee in DWEB tokens
  //const tx = await registrar.register(commitedRequest, true);
  
  //Wait for 1st confirmation
  return tx.wait(1);  
}

registerDomains().then((receipt)=>{
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});
```
### Registering TLD on Polygon
Registration of TLD on Polygon consists of 2 steps:
1. Sending commitment to register domain name
2. Finishing registration

Registration fee is paid either in DWEB or Wrapped Ether (WETH) tokens.
```typescript
import {ethers, providers, Wallet} from "ethers";
import {registration} from "@decentraweb/core";


const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new registration.PolygonTLDRegistrar({network: ETH_NETWORK, provider, signer});

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
  // If paying registration fee in DWEB tokens
  // const commitedRequest = await registrar.sendCommitment(approvedRequest, true);
  //Wait for 1 minute before registering domain name
  await wait(60);
  //If paying registration fee in ETH 
  const tx = await registrar.register(commitedRequest);
  //Wait for 1st confirmation
  return tx.wait(1);  
}

registerDomains().then((receipt)=>{
  // receipt is instance of ethers.js TransactionReceipt class
  // https://docs.ethers.org/v5/api/providers/types/#providers-TransactionReceipt
  console.log(receipt);
});
```

### Registering subdomain
Subdomain registration has no difference between Ethereum and Polygon networks.

There are two type of subdomain registrations:
1. Registering subdomain for domain name owned by you. We call it **self-registration**
2. Registering subdomain for staked domain name that belong to other owner. We call it **on-demand registration**

Decentraweb support 2 types of subdomains:
1. **Permanent** - subdomain that has no expiration date.
2. **Renewed** - subdomain that has expiration date and can be renewed.

During **self-registration** domain owner can make subdomain permanent by specifying 0 as duration. If duration is not
0 then subdomain owner will have to renew it before expiration date. Also, domain owner can set registration fee, that fee
will be paid to domain owner when subdomain is renewed.

During **on-demand registration** subdomain type (permanent or renewed) and renewal fee (if applicable), is defined by
parameters that owner has set when staking domain name.

#### Self-registration
In case of self-registration, you have to pay service fee. As of now, service fee is $2 per subdomain and is paid in ETH.
```typescript
import {ethers, providers, Wallet} from "ethers";
import {sld} from "@decentraweb/core";

const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new sld.EthereumSLDRegistrar({network: ETH_NETWORK, provider, signer});
async function registerSuddomains() {
  const approvedRegistration = await registrar.approveSelfRegistration([
    {name: '🙂🙂🙂', label: 'public'},
    {name: 'foobar', label: 'api'}
  ]);
  //It is recommended to cache approvedRegistration object, so you can resume registration if next step fails
  const tx = await registrar.registerSubdomains(approvedRegistration);
  const receipt = await tx.wait(1);
  console.log('Registered, TX hash', receipt.transactionHash);
}

registerSuddomains().then(() => {
  console.log('Done');
}).catch(err => {
  console.error(err);
});

```

### On-demand registration
Any user can set registration fee and stake their domain. This would allow other users to register subdomains for that 
domain name. 
```typescript
import {ethers, providers, Wallet} from "ethers";
import {sld} from "@decentraweb/core";

const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';
const PRIVATE_KEY = '0000000000000000000000000000000000000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
const signer = new Wallet(PRIVATE_KEY, provider);
const registrar = new sld.EthereumSLDRegistrar({network: ETH_NETWORK, provider, signer});
async function registerSuddomains() {
  const approvedRegistration = await registrar.approveOndemandRegistration([
    {name: '🙂🙂🙂', label: 'public'},
    {name: 'foobar', label: 'api'}
  ]);
  //It is recommended to cache approvedRegistration object, so you can resume registration if next step fails
  const tx = await registrar.registerSubdomains(approvedRegistration);
  const receipt = await tx.wait(1);
  console.log('Registered, TX hash', receipt.transactionHash);
}

registerSuddomains().then(() => {
  console.log('Done');
}).catch(err => {
  console.error(err);
});
``` 

## Reading and writing domain records
Domain names support following types of records:
1. Addresses
2. Content hash
3. Text records
4. DNS records

Ethereum netwrok support all types of records, while Polygon network support only addresses at this moment.

### Writing data to blockchain
As it was stated before, a valid signer instance must be provided to enable writing data to blockchain.

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
