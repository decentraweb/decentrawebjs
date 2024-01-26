export interface AccountDomainsResponse {
  data: Data;
}

export interface Data {
  account: Account;
}

export interface Account {
  domains: Domain[];
  __typename: string;
}

export interface Domain {
  id: string;
  labelName: string | null;
  labelhash: string;
  name: string;
  isTLD: boolean;
  expiryDate: string;
  createdAt: string;
  renewalFee: string | null;
  timestamp: string;
  parent: Parent;
  __typename: string;
}

export interface Parent {
  name: string | null;
  id: string;
  __typename: string;
}

const QUERY = `
query getDomains($id: ID!, $first: Int, $skip: Int, $orderBy: Domain_orderBy, $where: Domain_filter, $orderDirection: OrderDirection) {
  account(id: $id) {
    domains(first: $first, skip: $skip, orderBy: $orderBy, where: $where, orderDirection: $orderDirection) {
      id
      labelName
      labelhash
      name
      isTLD
      expiryDate
      createdAt
      renewalFee
      timestamp
      parent {
        name
        id
        __typename
      }
      __typename
    }
    __typename
  }
}
`;

export function accountDomainsPayload(
  address: string,
  skip: number,
  limit: number,
  network: 'eth' | 'matic'
) {
  const minExpirationMs = Date.now() - 90 * 24 * 3600 * 1000;
  return {
    operationName: 'getDomains',
    variables: {
      id: address.toLowerCase(),
      first: limit,
      skip: skip,
      network: network,
      where: {
        isTLD_in: [true, false],
        timestamp_lt: (Date.now() * 1000).toString(),
        isDummyNode: false,
        expiryDate_gte: (minExpirationMs * 1000).toString()
      },
      orderBy: 'timestamp',
      orderDirection: 'desc'
    },
    query: QUERY
  };
}
