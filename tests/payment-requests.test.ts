import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Payment Requests API (Invoices & Requests)', () => {
  it('POST /api/payment-requests creates a shareable payment request', async () => {
    const res = await request(app).post('/api/payment-requests').send({
      requester: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '50.0000',
      memo: 'Logo Design',
      expiresInHours: 24,
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.request.id).toMatch(/^REQ-\d+/);
    expect(res.body.request.status).toBe('ACTIVE');
    expect(res.body.shareUrl).toBe(`/request/${res.body.request.id}`);
  });

  it('GET /api/payment-requests/:id retrieves existing request details', async () => {
    const res = await request(app).get('/api/payment-requests/REQ-001');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.request.id).toBe('REQ-001');
    expect(res.body.request.amount).toBe('25.0000');
  });

  it('PATCH /api/payment-requests/:id/pay marks request fulfilled with transaction hash', async () => {
    const res = await request(app)
      .patch('/api/payment-requests/REQ-001/pay')
      .send({
        paid_by: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        transaction_hash: 'feedface0123456789abcdef0123456789abcdef0123456789abcdef01234567',
      });

    expect(res.status).toBe(200);
    expect(res.body.request.status).toBe('PAID');
    expect(res.body.request.paid_by).toBe('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
  });
});
