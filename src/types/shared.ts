export type PaymentStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'DISPUTED';

export type SettlementStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type EscrowStatus =
  | 'LOCKED'
  | 'UNLOCKED'
  | 'CLAIMED'
  | 'REFUNDED';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_REFUND'
  | 'RESOLVED_RELEASE';

export type Role =
  | 'Admin'
  | 'SettlementOperator'
  | 'Arbitrator'
  | 'Auditor';

export type PaymentCategory =
  | 'Standard'
  | 'Payroll'
  | 'Milestone'
  | 'Donation'
  | 'MicroPayment';

export type SplitMode = 'equal' | 'custom' | 'percentage';

export interface TokenAsset {
  code: string;
  issuer?: string;
  contractId?: string;
  decimals: number;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  action: string;
  actor: string;
  details: Record<string, any>;
}

export interface SharedSettlementRecipient {
  recipient: string;
  amount: string;
  percentage?: string;
}
