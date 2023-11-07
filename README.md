# Decentraweb DNS resolver service & DNS management libraries

This [Lerna](https://lerna.js.org/) [monorepo](https://monorepo.tools/#what-is-a-monorepo) is home to [Decentraweb](https://www.decentraweb.org/) JS libraries. It contains:

- `@decentraweb/core` - core library to interact with Decentraweb smart contracts
- `@decentraweb/namekit` - library to read data for DWEB, ENS and classic domains
- `@decentraweb/cli` - Command-line tool for interacting with Decentraweb smart contracts
- `@decentraweb/resolver` - DNS resolver server that support domain name resolution for DWEB, ENS and classic domains
- `@decentraweb/http-gateway` - a HTTP/S gateway service that supports DWEB DNS records and is used by [dwebs.to](http://dwebs.to)

**Note:** If you are an application developer, you should install [`@decentraweb/core`](https://www.npmjs.com/package/@decentraweb/core) and [`@decentraweb/namekit`](https://www.npmjs.com/package/@decentraweb/toolkit) libraries from the `npm` registry. This repository is used for development of these libraries.

## Setup

This will setup all subprojects.

```shell
npm install
npm run build
```
