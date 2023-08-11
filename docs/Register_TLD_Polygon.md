# Polygon TLD registration

## Registration fees

As of today TLD registration cost is:

- $50 if paid in DWEB tokens
- $100 if paid in WETH (Wrapped Ethereum)

## Registration process overview

Steps required to register TLD on Polygon network:

1. Check if sufficient amount is allowed to use for `RootRegistrarController` contract
2. Send commitment

## Step 1. Check user balance

Check if user has sufficient amount of DWEB or WETH tokens to pay for TLD registration.

```javascript
const contract = new Contract(tokenAddress, tokenABI, provider);
const balance = await contract.balanceOf(address);
```

Check if `RootRegistrarController` contract is allowed to use user's tokens:

```javascript
const tokenContract = new Contract(tokenAddress, TokenAbi, provider)
const approveBalance = await tokenContract.allowance(
account,
rootRegistrarControllerAddress
)
```

If approveBalance is less than price of TLD registration then approval is needed.

```javascript
TokenContractInstance.approve(
  rootRegistrarControllerAddress,
  utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), "ether"),
  { value: "0x00" }
);
```

## Step 2. Send commitment

Send request to Decentraweb API with signed commitment.

```http
POST /send-commitment-tx
Content-Type: application/json

{
  "name": [
    "dwebconnekt"
  ],
  "secret": "0xc945c9372177598c9dd0b12b77ec539df3842a50ce38e3fc04565cc40e848181",
  "signature": "0x61a9c5d1d8e86a06b3adda4d2b01eae5a4bf2c5c8db24865b24bfab03d1c6faf562f9ee04704810e44c023a86132d26cd196a71a795b12360903e7cd130ca0fc1c",
  "chainid": 80001,
  "owner": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9"
}
```

- `name` - accepts list of domains to be mint. It accepts multiple values. e.g. [“dwebconnekt”, “g2g”]
- `owner` - domains are mint for this address
- `secret` - random 32 bytes
- `chainid` - the network where you want to mint TLD (137 or 80001)
- `signature` - signature value

To get signature:

```javascript
const hash = web3.utils.soliditySha3(
  { t: "string", v: names },
  { t: "address", v: sigNormalize(owner) },
  { t: "bytes32", v: sigNormalize(secret) }
);
const signature = signMessage(utils.arrayify(hash))
```

Successful response:

```json
{
  "txid": "0x3a28b5df5a3829f5a492eb69fdf4b73e7110da7c213fa0bb773ef77a1ee08f71",
  "commitment": "0x354d49a298caa7305776c9eadc60e1db8edf49e8355ffffb2654366bb93a44cc",
  "chainId": 80001,
  "timestamp": 1685965748
}
```

- `txid` - transaction hash
- `commitment` - commitment value
- `chainId` - the network where you commited to register TLD (137 or 80001)
- `timestamp` - timestamp value. Registration must be completed within 30 minutes from this timestamp

## Step 3. Wait for one minute

The waiting period is required to ensure another person hasn’t tried to register the same Web3 Domain and to protect you after your registration request.

## Step 4. Request registration transaction

Call Decentraweb API to get registration transaction.

```http
POST /get-registration-tx
Content-Type: application/json

{
  "owner": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
  "chainid": 80001,
  "name": [
    "dwebconnekt"
  ],
  "duration": [
    31556926
  ],
  "timestamp": 1686037161,
  "feeTokenAddress": "0x602e78C34Da5208090B5A1d49db07F17737E5b11",
  "fee": "2450619909541283",
  "secret": "0x45e1f5b418086908ecf3205462a833321b4f5167ed01691a2682fc39ba820e19"
}

```

- `owner` - domains are mint for this address
- `chainid` - the network where you want to register TLD (137 or 80001)
- `name` - list of domains to be mint
- `duration` - duration of the domain in seconds. e.g. 1 year = 31556926 seconds
- `timestamp` - timestamp received on Step 2
- `feeTokenAddress` - token address of the payment option selected (DWEB or WETH)
- `fee` - fee multiplied by number of TLD that are being registered
- `secret` - value that was used on Step 2

Response is EIP712 typed data which then needs to be signed:

```json
{
  "types": {
    "EIP712Domain": [
      {
        "name": "name",
        "type": "string"
      },
      {
        "name": "version",
        "type": "string"
      },
      {
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "name": "salt",
        "type": "bytes32"
      }
    ],
    "MetaTransaction": [
      {
        "name": "nonce",
        "type": "uint256"
      },
      {
        "name": "from",
        "type": "address"
      },
      {
        "name": "functionSignature",
        "type": "bytes"
      }
    ]
  },
  "domain": {
    "name": "RootRegistrarController",
    "version": "1",
    "verifyingContract": "0xfead37D96113163d70E036765b595bd103b3604E",
    "salt": "0x0000000000000000000000000000000000000000000000000000000000013881"
  },
  "primaryType": "MetaTransaction",
  "message": {
    "nonce": 13,
    "from": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
    "functionSignature": "0xeffae2660000000000000000000000000000000000000000000000000000000000000100000000000000000000000000fcac3854ac463aa50da0ffd94d0d50bdea7457c9000000000000000000000000000000000000000000000000000000000000018045e1f5b418086908ecf3205462a833321b4f5167ed01691a2682fc39ba820e19000000000000000000000000000000000000000000000000000000000001388100000000000000000000000000000000000000000000000000000000647ee2a9000000000000000000000000602e78c34da5208090b5a1d49db07f17737e5b110000000000000000000000000000000000000000000000000008b4d369300da300000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000b64776562636f6e6e656b7400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000015180",
    "network": "Interact with Matic Network"
  }
}
```

## Step 5. Sign and submit registration transaction

Sign data from Step 4 and submit it to the network.

```javascript
const signature = signTypedData_v4(
  Buffer.from(privateKey, "hex"),
  { data: typedData }
);
```

Call Decentraweb API to submit registration transaction:

```http
POST /send-registration-tx
Content-Type: application/json

{
  "owner": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
  "chainid": 80001,
  "name": [
    "dwebconnekt"
  ],
  "duration": [
    86400
  ],
  "timestamp": 1686037161,
  "feeTokenAddress": "0x602e78C34Da5208090B5A1d49db07F17737E5b11",
  "fee": "2450619909541283",
  "secret": "0x45e1f5b418086908ecf3205462a833321b4f5167ed01691a2682fc39ba820e19",
  "signature": "0x8027cb4b67b287a2bf94d6aa067e44871d6204d2525900d2dd9cecafd841bd9544f433c996c44781c0a83b627e6a2567cd53c06df0e4a068dc4d21b9b000631c1b"
}

```

Response:

```json
{
  "txid": "0x6569f79041228e2c8c028cfc6f22bc4de7313b67b37fff37197034d87288d7cc"
}
```

- `txid` - transaction Hash.
