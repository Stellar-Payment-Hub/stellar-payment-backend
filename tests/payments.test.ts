import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Payments API & Event Processor', () => {
  it('GET /api/payments lists seeded payments', async () => {
    const res = await request(app).get('/api/payments');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.count).toBeGreaterThan(0);
    expect(Array.isArray(res.body.payments)).toBe(true);
  });

  it('GET /api/payments with status filter', async () => {
    const res = await request(app).get('/api/payments?status=COMPLETED');
    expect(res.status).toBe(200);
    expect(res.body.payments.every((p: { status: string }) => p.status === 'COMPLETED')).toBe(true);
  });

  it('POST /api/payments creates and indexes a new payment', async () => {
    const newPayment = {
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '50.0000000',
      memo: 'Test Invoice',
      on_chain_id: 101,
    };

    const res = await request(app).post('/api/payments').send(newPayment);
    expect(res.status).toBe(201);
    expect(res.body.payment.id).toBe('PAY-101');
    expect(res.body.payment.status).toBe('PENDING');
  });

  it('GET /api/payments/:id returns payment and its event history', async () => {
    const res = await request(app).get('/api/payments/PAY-101');
    expect(res.status).toBe(200);
    expect(res.body.payment.id).toBe('PAY-101');
    expect(res.body.events.length).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/payments/:id/status updates status', async () => {
    const res = await request(app)
      .patch('/api/payments/PAY-101/status')
      .send({ status: 'PROCESSING' });

    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('PROCESSING');
  });

  it('POST /api/events/process ingests event idempotently', async () => {
    const eventPayload = {
      event_type: 'PaymentCompleted' as const,
      payment_id: 'PAY-101',
      transaction_hash: 'tx-completed-101',
      ledger: 104300,
    };

    // First ingestion -> processed
    const firstRes = await request(app)
      .post('/api/events/process')
      .send(eventPayload);
    expect(firstRes.status).toBe(200);
    expect(firstRes.body.status).toBe('processed');

    // Verify payment status updated to COMPLETED
    const checkRes = await request(app).get('/api/payments/PAY-101');
    expect(checkRes.body.payment.status).toBe('COMPLETED');

    // Duplicate ingestion -> skipped
    const dupRes = await request(app)
      .post('/api/events/process')
      .send(eventPayload);
    expect(dupRes.status).toBe(200);
    expect(dupRes.body.status).toBe('skipped');
  });
});
