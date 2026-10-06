import { paymentRepository } from '../database/repository';
import { paymentStream } from '../realtime/payment-stream';
import { EventType, PaymentStatus } from '../database/schema';

export interface IngestEventInput {
  event_type: EventType;
  payment_id?: string;
  on_chain_id?: number;
  transaction_hash: string;
  ledger: number;
  new_status?: PaymentStatus;
  payload?: Record<string, unknown>;
}

export function processContractEvent(input: IngestEventInput): {
  processed: boolean;
  duplicate: boolean;
  paymentId?: string;
} {
  // Idempotency key: transaction_hash + event_type + ledger
  const dedupKey = `${input.transaction_hash}:${input.event_type}:${input.ledger}`;

  if (paymentRepository.isEventDuplicate(dedupKey)) {
    return { processed: false, duplicate: true };
  }

  // Find payment by user-facing ID or on-chain numeric ID
  let payment = input.payment_id
    ? paymentRepository.findById(input.payment_id)
    : undefined;

  if (!payment && input.on_chain_id !== undefined) {
    payment = paymentRepository.findByOnChainId(input.on_chain_id);
  }

  if (!payment) {
    return { processed: false, duplicate: false };
  }

  // Determine status transition based on event type
  let statusUpdate: PaymentStatus | undefined = input.new_status;
  if (!statusUpdate) {
    switch (input.event_type) {
      case 'PaymentCompleted':
        statusUpdate = 'COMPLETED';
        break;
      case 'PaymentCancelled':
        statusUpdate = 'CANCELLED';
        break;
      case 'PaymentUpdated':
        statusUpdate = 'PROCESSING';
        break;
      default:
        break;
    }
  }

  if (statusUpdate) {
    payment = paymentRepository.updateStatus(payment.id, statusUpdate);
  }

  // Record event audit trail
  const now = new Date().toISOString();
  paymentRepository.recordEvent({
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    payment_id: payment ? payment.id : input.payment_id || 'unknown',
    event_type: input.event_type,
    transaction_hash: input.transaction_hash,
    ledger: input.ledger,
    payload: input.payload || {},
    created_at: now,
  });

  paymentRepository.markEventProcessed(dedupKey);

  // Broadcast real-time update via SSE
  if (payment) {
    paymentStream.broadcast('payment:updated', {
      payment,
      event: input.event_type,
      timestamp: now,
    });
  }

  return {
    processed: true,
    duplicate: false,
    paymentId: payment ? payment.id : undefined,
  };
}
