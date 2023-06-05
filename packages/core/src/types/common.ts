import {ContractConfig, EthNetwork} from "../contracts/interfaces";
import {ethers, providers} from "ethers";

export type DwebConfig = {
  network: EthNetwork;
  provider: providers.BaseProvider;
  signer?: ethers.Signer;
  contracts?: ContractConfig;
};
