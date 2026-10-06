export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type SettlementStatus =
  | 'CREATED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type PaymentRequestStatus =
  | 'ACTIVE'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';

export type EventType =
  | 'PaymentCreated'
  | 'PaymentUpdated'
  | 'PaymentCompleted'
  | 'PaymentCancelled'
  | 'SettlementCreated'
  | 'SettlementRecipientProcessed'
  | 'SettlementCompleted'
  | 'SettlementCancelled';

export interface Payment {
  id: string; // User-facing ID, e.g. "PAY-001"
  on_chain_id: number;
  creator_address: string;
  recipient_address: string;
  amount: string; // in XLM
  memo: string;
  status: PaymentStatus;
  contract_address: string;
  transaction_hash?: string;
  ledger?: number;
  created_at: string;
  updated_at: string;
}

export interface SettlementRecipient {
  id: string;
  settlement_id: string;
  recipient: string;
  amount: string; // XLM
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  sub_payment_id?: string;
}

export interface Settlement {
  id: string; // e.g. "SETTLE-001"
  on_chain_id: number;
  payer: string;
  total_amount: string; // XLM
  recipient_count: number;
  memo: string;
  status: SettlementStatus;
  contract_address: string;
  recipients: SettlementRecipient[];
  sub_payment_ids: string[];
  transaction_hash?: string;
  ledger?: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string; // e.g. "REQ-001"
  requester: string;
  amount: string; // in XLM
  memo: string;
  status: PaymentRequestStatus;
  expires_at: string;
  created_at: string;
  paid_by?: string;
  transaction_hash?: string;
}

export interface PaymentEvent {
  id: string;
  payment_id?: string;
  settlement_id?: string;
  event_type: EventType;
  transaction_hash: string;
  ledger: number;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  source: string;
  destination: string;
  amount: string;
  asset: string;
  type: 'Native Payment' | 'Contract Payment' | 'Settlement' | 'Tip';
  status: 'Success' | 'Pending' | 'Failed';
  ledger: number;
  created_at: string;
}
