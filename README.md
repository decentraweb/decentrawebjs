# Decentraweb node DNS resolver and DNS management library

This is a monorepo consisting of:

- Decentraweb Core - Core SDK.
- Decentraweb CLI - Command-line interface for interacting with Decentraweb smart contract
- Decentraweb Resolver - Node.js Decentraweb Resolver

Both the CLI and Resolver depend on Decentraweb Core, that is why this project is a monorepo. Detailed README of each project is in its own folder under packages/*.

## Setup
```shell
npm install
npx lerna bootstrap
```
Create `.env` file. If you only want to read data, you can leave `WALLET` and `PKEY` empty.

To start resolver run:
```shell
npm run resolver 
```
In shell console run:
```shell
dig @127.0.0.1 -p 5333 sergiy.eth A
```

Also you can find sample code to set some DNS data in `packages/decentraweb-resolver/src/playground.ts`. To run playground code use `npm run playground` 
