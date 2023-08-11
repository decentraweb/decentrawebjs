# SLD Domain Mint

There are two types of subdomain registration:

1. Self registration - user is registering subdomain under his own domain
2. On-demand registration - user is registering subdomain under staked domain

## Self registration

Users registering subdomain for their own domains have to pay $2 fee in MATIC.
There are two type of API call first API to get message(EIP-712) and second is to get approval. The input parameters passed to in first api call of get message should exactly be same along with user signature when calling second api call

### Step 1. Request self-registration

```http
POST /get-approve-subdomain-registration
Content-Type: application/json

{
    "name": [
        "metaconnekt"
    ],
    "label": [
        "dweb"
    ],
    "owner": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
    "chainid": 80001,
    "sender": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
    "feeTokenAddress": "DWEB token Address or WETH token address"
}
```

1. `name` - array of normalized domain names
2. `label` - array of normalized subdomains, order must match domains
3. `owner` - The name of the owner. Domains are mint for this address
4. `chainid` - chain id of the network
5. `sender` - owner of the parent domain under which sld is being registered
6. `feeTokenAddress` - does not matter for self registration as  fee is paid in MATIC

Response is EIP-712 typed data:

```json
{
    "types": {
        "GPDomain": [
            {
                "name": "name",
                "type": "string"
            },
            {
                "name": "version",
                "type": "string"
            },
            {
                "name": "salt",
                "type": "bytes32"
            }
        ],
        "GPBatchSubDomainTransaction": [
            {
                "name": "name",
                "type": "string[]"
            },
            {
                "name": "label",
                "type": "string[]"
            },
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "chainid",
                "type": "uint256"
            },
            {
                "name": "sender",
                "type": "address"
            }
        ]
    },
    "domain": {
        "name": "EIP-712GeneralPurposeDomain",
        "version": "1",
        "salt": "0x7d1d812576d0f9dbeaa7b50933af0c2c70c55fe2c939989c5feaca55c4af4089"
    },
    "primaryType": "GPBatchSubDomainTransaction",
    "message": {
        "name": [
            "metaconnekt"
        ],
        "label": [
            "dweb"
        ],
        "owner": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
        "chainid": 5,
        "sender": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9"
    }
}
```

### Step 2 Get approval

Data received on step 2 needs to be signed by domain owned private key. Then next API endpoint needs to be called.

```http
POST /approve-subdomain-registration
Content-Type: application/json

{
  "name": [
    "metaconnekt"
  ],
  "label": [
    "dweb"
  ],
  "owner": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
  "chainid": 5,
  "sender": "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9",
  "feeTokenAddress": "DWEB token Address or WETH token address",
  "signature": "0xa78c080b3c28ca64717db96a473f93e21a990d8912039743d26a88308d079acb291e4ddad45e60ac1daeacb91d6b69770aa09af2f4ac1198aa450d30c210c4fd1b"
}
```

1. `name` - array of normalized domain names
2. `label` - array of normalized subdomains, order must match domains
3. `owner` - The name of the owner. Domains are mint for this address
4. `chainid` - chain id of the network
5. `sender` - owner of the parent domain under which sld is being registered
6. `feeTokenAddress` - does not matter for self registration as  fee is paid in MATIC
7. `signature` - EIP-712 signature of the typed data received from step 1

Response:

```json
{
    "commitment": "0xc2dff03b5e9238aecf2341bd6dac337c812988235e1b15fef2533af856d85278",
    "signature": "0xed90bc2c411f800179a005709d1c707f817544995b4d3abc6c65c83ba107646442167d60fce641b70733bfa2c90e320b60e5e6aeac499074f1e07242ff332b771c",
    "expiry": 1684478988,
    "names": [
        "metaconnekt"
    ],
    "labels": [
        "dweb"
    ],
    "fee": [
        "0"
    ],
    "domainowner": [
        "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9"
    ]
}
```

1. `commitment` - commitment value.
2. `signature` - signature value. It is used in contract call
3. `expiry` - user has to complete within this timestamp. The duration is 30 min from the response generation timestamp
4. `names` - Array of parent domains
5. `labels` - Array of labels.
6. `fee` - Fee for SLD mint. It is the array of price that user has to pay for each sld
7. `domainowner` - tld owner to which the sld fee will be paid. There can be multiple different owner in single tx

### Step 3. Call `createSubnodeBatch`

This function should be called on RootRegistrarController contract

```javascript
contract.createSubnodeBatch(
  [
    names,
    labels,
    domainowner,
    owner,
    chainId,
    expiry,
    feeTokenAddress,
    fee,
    v,
    r,
    s
  ],
  {
    value: serviceFee
  }
);
```

1. `names` - array of hashes of parent domains
2. `labels` - array of hashes keccak256 of labels
3. `domainowner` - array of addresses of domain owners
4. `owner` - address which will receive the tld
5. `chainId` - the network where you mint subdomain.
6. `expiry` - should have the same value as the one returned from the API.
7. `feeTokenAddress` - does not matter for self registration as  fee is paid in MATIC
8. `fee` - should have the same value as the one returned from the API.
9. `v`, `r`, `s` - values derived from `signature` parameter from the API.
10. `serviceFee` - The value is SLD service fee ($2 per domain) in MATIC.

## On-demand registration

### Step 1. Get subdomain registration approval

```http
POST /api/v1/approve-subdomain-registration
Content-Type: application/json

{
  "name": ["metaconnekt"],
  "label": ["dweb"],
  "owner": "0x31917487C6f420bfb76dAfcb3beC64249528C087",
  "chainid": 5,
  "sender": "",
  "feeTokenAddress": "DWEB token Address or WETH token address",
  "signature": ""
}
```

1. `name` - array of normalized domain names
2. `label` - array of normalized subdomains, order must match domains
3. `owner` - The name of the owner. Domains are mint for this address
4. `chainid` - chain id of the network
5. `sender` - empty string
6. `feeTokenAddress` - either WETH or DWEB token address depending on which token user wants to pay
7. `signature` - empty string

Response:
```json
{
  "commitment": "0x3e5eaeed503195011e3abc668321bb6b970f15fe4823746cbe0ca11df513a9e5",
  "signature": "0x638958266b6a95f624a0f52a0e87df280d13dfeb71944388a0c06545f2cd6d1c2ce3e80ca414ad4d0e6216112e635dc91eac28f43517ea2f79e15261830f0e751b",
  "expiry": 1684401071,
  "names": [
    "metaconnekt"
  ],
  "labels": [
    "dweb"
  ],
  "fee": [
    "0"
  ],
  "domainowner": [
    "0xfCAc3854AC463aA50da0ffd94d0d50bDEa7457c9"
  ]
}
```

1. `commitment` - commitment value.
2. `signature` - signature value. It is used in contract call
3. `expiry` - user has to complete within this timestamp. The duration is 30 min from the response generation timestamp
4. `names` - array of parent domains
5. `labels` - array of labels.
6. `fee` - fee for SLD mint. It is the array of price that user has to pay for each sld
7. `domainowner` - tld owner to which the sld fee will be paid. There can be multiple different owner in single tx

### Step 2. Call `createSubnodeBatch`
This function should be called on RootRegistrarController contract

```javascript
contract.createSubnodeBatch(
  [
    names,
    labels,
    domainowner,
    owner,
    chainId,
    expiry,
    feeTokenAddress,
    fee,
    v,
    r,
    s
  ],
  {
    value: serviceFee
  }
);
```

1. `names` - array of hashes of parent domains
2. `labels` - array of hashes keccak256 of labels
3. `domainowner` - array of addresses of domain owners
4. `owner` - address which will receive the tld
5. `chainId` - the network where you mint subdomain.
6. `expiry` - should have the same value as the one returned from the API.
7. `feeTokenAddress` - does not matter for self registration as  fee is paid in MATIC
8. `fee` - should have the same value as the one returned from the API.
9. `v`, `r`, `s` - values derived from `signature` parameter from the API.
10. `serviceFee` - The value is SLD service fee ($2 per domain) in MATIC.


Notes:
Whenever sending ether with the tx, always send 10% buffer to cover price fluctuation
Supported fee to mint TLD are WETH and DWEB
There is a sld mint service fee (called sld service fee)charged to user while minting sld. Currently it is set as $2 (RootRegistrarController.subdomainFee()). It is always paid in MATIC.
There are two types of whitelist maintained to waive off from sld service fee
Address whitelist: Address can be checked using RootRegistrarController.whitelistAddressForSLDFee(address). if parent domain owner address is whitelisted then subdomains mint under such parent don't have to pay $2 fee
Domain whitelist: Domain can be checked using RootRegistrarController.whitelistDomainForSLDFee(namehash of domain). if domain is whitelisted then subdomains mint under such domain don't have to pay $2 fee
