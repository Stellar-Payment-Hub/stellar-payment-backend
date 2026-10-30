import { PaymentEvent } from '../database/schema';

export function generateMockSorobanEvent(paymentId: string, amount: string): PaymentEvent {
  return {
    id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    payment_id: paymentId,
    event_type: 'PaymentCompleted',
    transaction_hash: `mock-tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    ledger: 104320,
    payload: {
      amount,
      completedAt: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  };
}
