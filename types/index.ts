export interface User {
  id: string;
  email: string;
  balanceUSD: number;
  balanceDOGE: number;
  streakDays: number;
  lastDailyClaim: number | null;
  totalDailyEarned: number;
  lastClaim: number | null;
  totalClaims: number;
  ipHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface Claim {
  id: string;
  userId: string;
  amountUSD: number;
  amountDOGE: number;
  timestamp: number;
  ipHash: string;
  type: 'claim' | 'daily_bonus' | 'code';
  codeId?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  amountUSD: number;
  amountDOGE: number;
  dogeAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  processedBy?: string;
  rejectionReason?: string;
}

export interface DailyCode {
  id: string;
  code: string;
  rewardUSD: number;
  rewardDOGE: number;
  isActive: boolean;
  createdAt: number;
  expiresAt?: number;
  maxUses?: number;
  currentUses: number;
}

export interface CodeRedemption {
  id: string;
  userId: string;
  codeId: string;
  code: string;
  rewardUSD: number;
  rewardDOGE: number;
  redeemedAt: number;
  ipHash: string;
}

export interface SecurityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipHash: string;
  timestamp: number;
  suspicious: boolean;
}
