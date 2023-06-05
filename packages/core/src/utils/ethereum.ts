import {EthNetwork} from "../contracts/interfaces";

export function getChainId(network: EthNetwork) {
    switch (network) {
        case 'mainnet':
            return 1;
        case 'goerli':
            return 5;
        default:
            throw new Error('Unknown network name');
    }
}
