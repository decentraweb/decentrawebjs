# `http-gateway`

> TODO: description

## Usage

```
import HTTPGateway from '@decentraweb/http-gateway';
import { providers } from 'ethers';

const provider = new providers.JsonRpcProvider('https://mainnet.infura.io/v3/00000000000000000000000000000000, 'mainnet');
const gateway = new HTTPGateway({
  baseDomain: 'dwebs.to',
  ipfsGatewayIp: '18.177.155.53',
  network: 'mainnet',
  provider
});
gateway.listen(80).then(() => {
  console.log(`Decentraweb gateway listening port 80`);
});
```
