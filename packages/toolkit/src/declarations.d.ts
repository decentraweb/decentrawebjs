declare module '@ensdomains/ens-contracts';

declare module '@ensdomains/eth-ens-namehash' {
  function hash(name: string): string;

  function normalize(name: string): string;
}
