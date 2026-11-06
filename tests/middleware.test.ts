import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { paymentRepository } from '../src/database/repository';

describe('Middleware Integration', () => {
  it('attaches RateLimit headers to all responses', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
    expect(res.headers['ratelimit-reset']).toBeDefined();
  });

  it('propagates or assigns X-Correlation-ID header', async () => {
    const testId = 'corr-test-12345';
    const res = await request(app).get('/health').set('X-Correlation-ID', testId);
    expect(res.headers['x-correlation-id']).toBe(testId);
  });
});

describe('Production Authentication Enforcement (NODE_ENV=production)', () => {
  const originalEnv = { ...process.env };
  let testPaymentId: string;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_API_TOKEN;
    delete process.env.ADMIN_API_KEY;

    const payment = paymentRepository.create({
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '10.0000000',
      memo: 'Auth test',
      status: 'PENDING',
      contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
      transaction_hash: 'tx-auth-test',
      ledger: 104500,
    });
    testPaymentId = payment.id;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('fails closed when neither ADMIN_API_TOKEN nor ADMIN_API_KEY is configured', async () => {
    const res = await request(app)
      .patch(`/api/payments/${testPaymentId}/status`)
      .set('Authorization', 'Bearer some-token')
      .send({ status: 'PROCESSING' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Unauthorized');
  });

  it('accepts authorization via ADMIN_API_TOKEN in production', async () => {
    process.env.ADMIN_API_TOKEN = 'secure_admin_prod_token_7788';

    const res = await request(app)
      .patch(`/api/payments/${testPaymentId}/status`)
      .set('Authorization', 'Bearer secure_admin_prod_token_7788')
      .send({ status: 'PROCESSING' });

    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('PROCESSING');
  });

  it('accepts authorization via ADMIN_API_KEY in production', async () => {
    process.env.ADMIN_API_KEY = 'secure_admin_prod_key_9900';

    const res = await request(app)
      .patch(`/api/payments/${testPaymentId}/status`)
      .set('Authorization', 'Bearer secure_admin_prod_key_9900')
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.payment.status).toBe('COMPLETED');
  });

  it('rejects invalid token in production', async () => {
    process.env.ADMIN_API_TOKEN = 'real_token';

    const res = await request(app)
      .patch(`/api/payments/${testPaymentId}/status`)
      .set('Authorization', 'Bearer wrong_token')
      .send({ status: 'PROCESSING' });

    expect(res.status).toBe(401);
  });
});
