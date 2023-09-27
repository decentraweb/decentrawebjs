# Decentraweb node DNS resolver and DNS management library

This monorepo is home for [Decentraweb](https://www.decentraweb.org/) JS libraries. It contains:
- `@decentraweb/core` - core library to interact with Decentraweb contracts.
- `@decentraweb/toolkit` - library to read data for DWEB, ENS and classic domains
- `@decentraweb/cli` - Command-line tool for interacting with Decentraweb smart contract
- `@decentraweb/resolver` - DNS resolver server that support domain name resolution for DWEB, ENS and classic domains
- `@decentraweb/http-gateway` - HTTP gateway that is used by [dwebs.to](https://dwebs.to)

**Note:** If you are application developer, you should use `@decentraweb/core` and `@decentraweb/toolkit` libraries from
`npm` registry. This repository is used for development of these libraries.

## Setup
```shell
npm install
npm build
```
### Run resolver
Create `.env` file in `packages/resolver` from `.env.example`.

To start resolver run:
```shell
npm run resolver 
```
To test resolver in shell console run:
```shell
dig @127.0.0.1 -p 5333 your_dweb_domain A
```
