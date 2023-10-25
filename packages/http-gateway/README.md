# Decentraweb HTTP Gateway

This package is HTTP gateway for Decentraweb. It allows to access domains hosted Decentraweb, without making any
additional configuration on client side. This package is used by https://dwebs.to/ You can find mode details [here](https://docs.decentraweb.org/decentraweb/using-decentraweb-domains/using-the-dwebs.to-web2-bridge).

## Setup
We assume you have node.js v16+ and npm installed. If not please go to https://nodejs.org/ to get latest stable version.

Preparation steps:
1. Create directory to store resolver data (`mkdir ~/dweb-gateway`)
2. Go to this directory (`cd ~/dweb-gateway`)
3. Create directory to store certificates (`mkdir ./certs`)
4. Install resolver package `npm install @decentraweb/http-gateway`
5. With editor of your choice create `index.mjs` file with following content:
```javascript
import path from 'path';
import {HTTPGateway} from "@decentraweb/http-gateway";
import {providers} from "ethers";
import * as Sentry from '@sentry/node';
import {addExtensionMethods} from '@sentry/tracing';

const ETH_NETWORK = 'mainnet';
const JSONRPC_URL = 'https://mainnet.infura.io/v3/00000000000000000000000000000000';

const provider = new providers.JsonRpcProvider(JSONRPC_URL, ETH_NETWORK);
// You can register your own Sentry account and provide your own DSN here to monitor your gateway
Sentry.init();
addExtensionMethods();

const gateway = new HTTPGateway({
  baseDomain: 'gw.acme.com', // This is domain that will be used to access Decentraweb domains ({domain}.gw.acme.com)
  ipfsGatewayIp: '18.177.155.53',
  network: ETH_NETWORK,
  provider,
  certs: {
    storageDir: path.resolve('../../certs'),
    maintainerEmail: 'admin@acme.com'
  }
});


gateway.listenHttp(8080).then((port) => {
  console.log(`Decentraweb gateway listening port ${port}`);
});
gateway.listenHttps(8443).then((port) => {
  console.log(`Decentraweb gateway listening port ${port}`);
});


```
## Running
To start gateway execute `node index.mjs` in shell console. You should see following output:
```
Decentraweb gateway listening port 80
Decentraweb gateway listening port 443
```

To test, open `https://sagan.gw.acme.com/` in your browser.

### Running as a service
There are numerous ways to run Node.js process as a service. We recommend using [pm2](https://pm2.keymetrics.io/).
