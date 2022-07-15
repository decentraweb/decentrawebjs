import HTTPGateway from "./index";
import {providers} from "ethers";

const provider = new providers.JsonRpcProvider('https://rinkeby.infura.io/v3/9b829b3ce637400894fc7401540b2dfc', 'rinkeby');
const gateway = new HTTPGateway({
  baseDomain: 'dwebs.to',
  network: 'rinkeby',
  provider
});

gateway.listen(3000).then(()=>{
  console.log('Listening port 3000')
});
