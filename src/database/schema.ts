export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type EventType =
  | 'PaymentCreated'
  | 'PaymentUpdated'
  | 'PaymentCompleted'
  | 'PaymentCancelled';

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

export interface PaymentEvent {
  id: string;
  payment_id: string;
  event_type: EventType;
  transaction_hash: string;
  ledger: number;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  payment_id: string;
  transaction_hash: string;
  status: string;
  ledger: number;
  created_at: string;
}
