/**
 * Domain is not staked
 */
export interface NotStakedDomain {
  name: string;
  staked: false;
}

/**
 * Domain is staked
 */
export interface StakedDomain {
  /** Domain name */
  name: string;
  staked: true;
  /** Registration fee paid to owned in USD */
  price: number;
  /** Number of SLD registrations per owner */
  sldPerWallet: number;
  /** Type of staking:
   * 1.`public` - anyone can register subdomain
   * 2.`address` - specific addresses can own registered subdomains
   * 3.`nft` - specific NFTs can own registered subdomains
   * 4.`erc20` - specific ERC20 tokens can own registered subdomains
   */
  stakingType: 'public' | 'address' | 'nft' | 'erc20';
  /** Type of renewal:
   * 1.`permanent` - domain is owned forever
   * 2.`renewed` - domain needs to be renewed after expiration
   */
  renewalType: 'permanent' | 'renewed';
  /** Renewal fee for `renewed` domains in USD. Fee is paid to owned. Additionally, there is service fee for renewal */
  renewalFee: number;
}

/**
 * Domain staking status
 */
export type StakingState = NotStakedDomain | StakedDomain;
