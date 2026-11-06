import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { processContractEvent } from '../src/events/processor';
import { paymentRepository } from '../src/database/repository';

describe('Smart Contract & Backend Attack Resilience', () => {
  it('prevents double-spend replay attacks via contract event idempotency keys', () => {
    // Register test payment
    const payment = paymentRepository.create({
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '75.0000000',
      memo: 'Anti-Replay Verification',
      status: 'PENDING',
      contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
      transaction_hash: 'tx-replay-attack-target-001',
      ledger: 104500,
    });

    const eventPayload = {
      event_type: 'PaymentCompleted' as const,
      payment_id: payment.id,
      transaction_hash: 'tx-attack-proof-001',
      ledger: 104500,
    };

    // First processing succeeds
    const firstAttempt = processContractEvent(eventPayload);
    expect(firstAttempt.processed).toBe(true);
    expect(firstAttempt.duplicate).toBe(false);

    // Duplicate replay attempt is flagged and rejected
    const replayAttempt = processContractEvent(eventPayload);
    expect(replayAttempt.processed).toBe(false);
    expect(replayAttempt.duplicate).toBe(true);
  });

  it('rejects unauthorized payment creation attempts with invalid amounts', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '-50.00', // Malicious negative amount
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('positive number');
  });

  it('rejects payment creation with malformed addresses', async () => {
    const res = await request(app)
      .post('/api/payments')
      .send({
        creator_address: 'invalid-address',
        recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '10.00',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('valid Stellar public keys');
  });
});

