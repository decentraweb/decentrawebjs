# Decentraweb node DNS resolver and DNS management library

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

Also you can find sample code to set some DNS data in `playground.ts`. 
