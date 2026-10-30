import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('End-to-End Payment & Settlement Lifecycle', () => {
  it('creates payment, queries with filter, creates settlement, and verifies analytics', async () => {
    // 1. Create payment
    const createRes = await request(app)
      .post('/api/payments')
      .send({
        creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '88.5000000',
        memo: 'E2E Lifecycle Test',
      });
    expect(createRes.status).toBe(201);
    const paymentId = createRes.body.payment.id;

    // 2. Query search
    const searchRes = await request(app)
      .get('/api/payments/search')
      .query({ q: 'Lifecycle' });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.some((p: any) => p.id === paymentId)).toBe(true);

    // 3. Calculate split bill
    const splitRes = await request(app)
      .post('/api/settlements/calculate-split')
      .send({
        totalAmountXlm: '100',
        recipients: [
          'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        ],
      });
    expect(splitRes.status).toBe(200);
    expect(splitRes.body.allocations.length).toBe(2);

    // 4. Verify analytics updated
    const analyticsRes = await request(app).get('/api/analytics/summary');
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.totalPaymentsCount).toBeGreaterThan(0);
  });
});
