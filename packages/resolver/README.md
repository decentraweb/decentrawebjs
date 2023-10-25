# Decentraweb node DNS resolver and DNS management library
This package is DNS resolver. It supports resolving DWEB, ENS and ICANN domain names.

**Resolution logic:**
1. If domain ends with `.eth` then it is resolved through ENS.
2. If domain has one of the ICANN TLDs, then it is resolved through regular DNS. 
3. All other domains are resolved with DWEB contracts.

List of ICANN domains can be found at https://data.iana.org/TLD/tlds-alpha-by-domain.txt 

## Resolver types
This package include 3 resolver classes:
1. TCPResolver
2. UDPResolver
3. DOHResolver

TCP and UDP resolvers work with standard DNS protocol which uses binary data format known as 
"wire format". 

`DOHResolver` support 2 types of resolution:
1. `https://{server_address}/dns-query` - standard [RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) binary format
2. `https://{server_address}/resolve` - JSON API for app developers.

If you are only interested in JSON API, then you can only instantiate `DOHResolver`.

### Binary queries
We use [dns-packet](https://www.npmjs.com/package/dns-packet) package to encode/decode binary DNS packets. It has code
samples for querying DNS over TCP, UPD and DoH https://github.com/mafintosh/dns-packet/tree/master/examples

### JSON API
For app developers it is also possible to use simple JSON API to resolve names.

```shell
curl --location --request GET 'https://{server_address}/resolve?name=frontender.me&type=A'
```

Parameters:
1. `name` - domain name.
2. `type` - record type. Either id or string representation supported. List of types can be found [here](https://en.wikipedia.org/wiki/List_of_DNS_record_types).
Defaults to `A` if not specified.


## Setup
We assume you have node.js v16+ and npm installed. If not please go to https://nodejs.org/ to get latest stable version.

Preparation steps:
1. Create directory to store resolver data. For example `mkdir ~/dweb-resolver`
2. Go to this directory (`cd ~/dweb-resolver`)
3. Install resolver package `npm install @decentraweb/resolver`
4. With editor of your choice create `index.mjs` file with following content:
```javascript 
import { UDPResolver, TCPResolver, DOHResolver } from "@decentraweb/resolver";

/**
 * IP address to listen on. If you want to listen on all interfaces, then use '0.0.0.0'
 */
const addr = '127.0.0.1'
const resolverConfig = {
  blockchain: {
    apiProvider: 'infura', //Supported providers: 'etherscan', 'infura', 'alchemy', 'cloudflare', 'pocket', 'ankr'
    apiKey: '00000000000000000000000000000000', // Your api key
    production: false, // If true, then mainnet and matic networks will be used, otherwise goerli and maticmum
  },
  ipfsGateway: {
    /**
     * IPFS gateway address, domains that have contentHash records will be redirected to this address. Gateway must be 
     * configured to resolve names through this resolver.
     */
    A: '18.177.155.53'
  }
};

const udpServer = new UDPResolver(resolverConfig);

const tcpServer = new TCPResolver(resolverConfig);

const dohServer = new DOHResolver({
  ...resolverConfig,
  cors: true
});

udpServer.listen(53, addr).then(() => {
  console.log(`UDP resolver listening`);
});

tcpServer.listen(53, addr).then(() => {
  console.log(`TCP resolver listening`);
});

dohServer.listen(80).then(() => {
  console.log(`DOH resolver listening`);
});
```
If you would like to use different provider or even your own Ethereum nodes, then config would look like this:
```javascript
import {providers} from 'ethers';
const resolverConfig = {
  blockchain: {
    ethereum: {
      network: 'mainnet', // Or 'goerli'
      provider: new providers.JsonRpcProvider('https://mainnet.infura.io/v3/00000000000000000000000000000000')
    },
    polygon: {
      network: 'matic', // or 'maticmum' if goerli was used for Ethereum
      provider:  new providers.JsonRpcProvider('https://matic.infura.io/v3/00000000000000000000000000000000'),
    },
  },
  ipfsGateway: {
    A: '18.177.155.53'
  }
};
```

## Running
To run resolver execute `node index.mjs` in shell console. You should see following output:
```
UDP resolver listening
DOH resolver listening
TCP resolver listening
```

In another console run:
```shell
dig @127.0.0.1 -p 53 sagan A
```
### Running as a service
There are numerous ways to run Node.js process as a service. We recommend using [pm2](https://pm2.keymetrics.io/).
