import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Transactions API (Transaction History & Indexing)', () => {
  it('GET /api/transactions returns blockchain transaction ledger', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.transactions)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/transactions records a new transaction entry', async () => {
    const res = await request(app).post('/api/transactions').send({
      hash: 'abc123def4560123456789abcdef0123456789abcdef0123456789abcdef0123',
      source: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      destination: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '50.0000 XLM',
      type: 'Multi-Payment',
      status: 'Success',
      ledger: 104500,
    });

    expect(res.status).toBe(201);
    expect(res.body.transaction.hash).toBe('abc123def4560123456789abcdef0123456789abcdef0123456789abcdef0123');
    expect(res.body.transaction.status).toBe('Success');
  });
});
