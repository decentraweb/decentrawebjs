import {ChainId, EthNetwork} from "../contracts/interfaces";

export function getChainId(network: EthNetwork): ChainId {
    switch (network) {
        case 'mainnet':
            return 1;
        case 'goerli':
            return 5;
        case 'matic':
            return 137;
        case 'maticmum':
            return 80001;
        default:
            throw new Error('Unknown network name');
    }
}
