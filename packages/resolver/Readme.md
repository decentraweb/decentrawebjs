# Decentraweb node DNS resolver and DNS management library
This package is DNS resolver. It support resolving DWEB, ENS and ICANN domain names.

If domain ends with `.eth` then it is resolved through ENS. If domain has 
one of the ICANN TLDs, then it is resolved through regular DNS. All other domains are resolved
with DWEB contracts.

List of ICANN domains can be found at https://data.iana.org/TLD/tlds-alpha-by-domain.txt and is 
stored in `./icann_tlds.txt` file. It needs to be regulary updated.

## Resolver types
This package include 3 resolver classes:
1. TCPResolver
2. UDPResolver
3. DOHResolver

TCP and UDP resolvers work with standard DNS protocol which uses binary data format known as 
"wire format". 

`DOHResolver` support 2 types of resolution:
1. `https://{server_address}/dns-query` - standard [RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) binary format
2. `https://{server_address}/resolve` - JSON API for app developers.

### Binary queries
We use [dns-packet](https://www.npmjs.com/package/dns-packet) package to encode/decode binary DNS packets. It has code
samples for querying DNS over TCP, UPD and DoH https://github.com/mafintosh/dns-packet/tree/master/examples

### JSON API
For app developers it is also possible to use simple JSON API to resolve names.

```shell
curl --location --request GET 'resolver.decentraweb.org/resolve?name=frontender.me&type=A'
```

Parameters:
1. `name` - domain name.
2. `type` - record type. Either id or string representation supported. List of types can be found [here](https://en.wikipedia.org/wiki/List_of_DNS_record_types).
Defaults to `A` if not specified.


## Setup
```shell
npm install
npm run build
```
Create `.env` file. If you only want to read data, you can leave `WALLET` and `PKEY` empty.

To start resolver run:
```shell
npm run start:resolver 
```
In shell console run:
```shell
dig @127.0.0.1 -p 5333 sergiy.eth A
```

