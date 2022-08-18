declare module '@ensdomains/ens-contracts';

declare module '@ensdomains/eth-ens-namehash' {
  function hash(name: string):string;
  function normalize(name: string): string;
}

declare module '@ensdomains/content-hash' {
  function decode(contentHash: string):string;
  function fromIpfs(ipfsHash: string): string;
  function fromSkylink(skylink: string): string;
  function fromSwarm(swarmHash: string): string;
  function fromArweave(arweave: string): string;
  function encode(codec: string, value: string): string;
  function getCodec(hash: string): string;
}
