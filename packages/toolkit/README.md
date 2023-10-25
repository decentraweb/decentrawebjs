# Decentraweb Toolkit
Toolkit package intended to allow app developers to seamlessly integrate decentralized name systems into their apps.
Right now it has support for [ENS](https://ens.domains/), [Decentraweb](https://www.decentraweb.org/) and limited support
of classic DNS system.

For now Toolkit only support reading data. If you need to manage domain data, please check 
[@decentraweb/core](https://www.npmjs.com/package/@decentraweb/core) or one of [ENS libraries](https://docs.ens.domains/dapp-developer-guide/ens-libraries). 

## Domain resolution logic
Domain name provider is detected using following logic:
1. If domain name ends with `.eth` then it is resolved through ENS
2. If domain name TLD match one of the ICANN TLDs, then it is resolved through regular DNS. 
3. All other domains are resolved with DWEB contracts.

List of ICANN domains can be found [here](https://data.iana.org/TLD/tlds-alpha-by-domain.txt) and is updated regulary.

**Important Note:** This logic may change in the future.

## Installation and initialization
To install library run `npm install --save @decentraweb/toolkit ethers@5` in your project directory.

Toolkit uses [ethers.js](https://docs.ethers.io/v5/) to call Ethereum contracts. It is required as peer dependency.

Decentraweb supports both Ethereum and Polygon networks. Toolkit will automatically detect which network to use based on
where domain name is located currently. To initialize Toolkit instance you need to pass Ethereum and Polygon network 
name (`mainnet` is used with 'matic' and `goerli` is used with 'maticmum') and ethers.js providers for each network. 
```typescript
import {providers, Wallet} from "ethers";
import DwebToolkit, {ToolkitConfig} from "@decentraweb/toolkit";

const ETH_NETWORK = 'goerli';
const ETH_JSONRPC_URL = 'https://goerli.infura.io/v3/00000000000000000000000000000000';
const POLYGON_NETWORK = 'maticmum';
const POLYGON_JSONRPC_URL = 'https://polygon-mumbai.infura.io/v3/00000000000000000000000000000000';
const config: ToolkitConfig = {
  ethereum: {
    network: ETH_NETWORK,
    provider: new providers.JsonRpcProvider(ETH_JSONRPC_URL, ETH_NETWORK),
  },
  polygon: {
    network: POLYGON_NETWORK,
    provider: new providers.JsonRpcProvider(POLYGON_JSONRPC_URL, POLYGON_NETWORK)
  }
};
const toolkit = new DwebToolkit(config);
```
Alternatively, if you use one of supported providers, you can initialize Toolkit in a simpler way:
```typescript
const config: ToolkitConfig = {
  apiProvider: 'infura', //Supported providers: 'etherscan', 'infura', 'alchemy', 'cloudflare', 'pocket', 'ankr'
  apiKey: '00000000000000000000000000000000', //
  production: false //If true, then mainnet and matic networks will be used, otherwise goerli and maticmum
};
const toolkit = new DwebToolkit(config);
```
### Browser bundle
In most cases importing library using `npm` is preferred way, but for fast prototyping you can load it from our CND:
```html

<script src="https://cdn.ethers.io/lib/ethers-5.7.umd.min.js" type="application/javascript"></script>
<script src="https://cdn.decentraweb.org/decentraweb-toolkit-2.0.0.min.js" type="application/javascript"></script>
<script>
  window.addEventListener('load', async () => {
    const {DwebToolkit} = Decentraweb;
    const toolkit = new DwebToolkit({
      ethereum: {
        network: 'goerli',
        provider: ethers.getDefaultProvider('goerli')
      },
      polygon: {
        network: 'maticmum',
        provider: ethers.getDefaultProvider('maticmum')
      }
    })
</script>
```
## Resolve Ethereum address to name
Ethereum address can be resolved through both Decentraweb and ENS contracts or through one specified system.
```typescript
const names = await toolkit.address.resolve('0x4323E6b155BCf0b25f8c4C0B37dA808e3550b521');
/*
Returns:
[
  { provider: 'dweb', name: 'vitalik' },
  { provider: 'ens', name: 'vitalik.eth' }
]
*/
//To query Decentraweb only
const dwebName = await toolkit.address.resolve('0x4323E6b155BCf0b25f8c4C0B37dA808e3550b521', 'dweb');
/*
Returns: 'vitalik'
*/
// Alternatively to query ENS
const ensName = await toolkit.address.resolve('0x4323E6b155BCf0b25f8c4C0B37dA808e3550b521', 'ens');
/*
Returns: 'vitalik.eth'
*/

```
## Resolve name to Ethereum address
In this case Toolkit will detect which domain name system name belongs to and will look for Ethereum address associated 
with given name. Note that classic domains will always return `null`.
```typescript
const address = await toolkit.address.lookup('vitalik');
/*
Returns: '0x4323E6b155BCf0b25f8c4C0B37dA808e3550b521'
*/
```
## Reading extended domain data
By calling `toolkit.domain(domainName)` you can get instance of class that will allow to read extended data associated
with domain name. Depending on domain name provider you will get either `DWEBDomain`, `ENSDomain` or `ICANNDomain` instance.
Below you can see feature support table for different domain name systems.

|                | DWEB | ENS |      ICANN      |
|----------------|:----:|:---:|:---------------:|
| Wallet address | yes  | yes |       no        |
| Content Hash   | yes  | yes | yes<sup>1</sup> |
| Text Records   | yes  | yes |       no        |
| DNS records    | yes  | yes |       yes       |

1. supported through [DNSLink](https://dnslink.dev/)

```typescript
const domain = await toolkit.domain('vitalik');
if (domain) {
  const domainProvider = domain.provider; // 'ens'
  const ethAddress = await domain.address('ETH'); // '0x4323E6b155BCf0b25f8c4C0B37dA808e3550b521'
  const contentHash = await domain.contentHash(); // 'ipfs://bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze'
  const githubName = await domain.txt('email'); // 'foo@bar.baz'
  const records = await domain.dns('A'); // [{ name: 'vitalik', type: 'A', ttl: 3600, class: 'IN', data: '127.0.0.1'}]
}
```


## Domain name
All domain name wrapper classes (`DWEBDomain`, `ENSDomain` and `ICANNDomain`) have same interface to provide consistent API for developers.

```typescript
interface BaseDomain {
  //Domain name
  readonly name: string;
  //Which domain name system is used to query the data
  readonly provider: 'dweb' | 'ens' | 'icann';
  //Supported features for domain
  readonly features: {
    address: boolean;
    contentHash: boolean;
    dns: boolean;
    txt: boolean;
  };

  //Get cryptocurrency address for given coinId
  address(coinId: string): Promise<string | null>;

  //Get contenthash associated with domain name
  contentHash(): Promise<string | null>;

  //Get DNS records of given type. Response contains JSON representation of records
  dns(recordType: string): Promise<dnspacket.Answer[]>;

  //Check if domain name is registered
  exists(): Promise<boolean>;

  //Read text records on domain
  txt(key: string): Promise<string | null>;
}
```
**Notes:**
1. Full list of supported cryptocurrencies can be found in [@ensdomains/address-encoder](https://www.npmjs.com/package/@ensdomains/address-encoder) documentation.
2. Unsupported feature methods will always return `null` and won't throw an error. 
3. There is no reliable way to check if domain name is registered for classic DNS. Because of this `domain.exists()` will always return `true` for `icann` domains.  
4. DNS records are stored in binary format. This library uses [dns-packet](https://www.npmjs.com/package/dns-packet) library to encode/decode data.
