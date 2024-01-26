export interface AccountDomain {
  name: string;
  isTLD: boolean;
  createdAt: Date;
  expiresAt: Date | null;
  renewalFee: number | null;
}
