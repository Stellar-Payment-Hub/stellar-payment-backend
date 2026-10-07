import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Settlements API (Multi-Recipient Settlement)', () => {
  it('GET /api/settlements returns initial seeded settlements', async () => {
    const res = await request(app).get('/api/settlements');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.settlements)).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/settlements creates a multi-address settlement request with exact sum validation', async () => {
    const payload = {
      payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      total_amount: '60.0000',
      memo: 'Split Dinner',
      recipients: [
        { recipient: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: '30.0000' },
        { recipient: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7', amount: '30.0000' },
      ],
    };

    const res = await request(app).post('/api/settlements').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.settlement.id).toMatch(/^SETTLE-\d+/);
    expect(res.body.settlement.recipient_count).toBe(2);
    expect(res.body.settlement.status).toBe('CREATED');
  });

  it('POST /api/settlements rejects sum mismatch between shares and total_amount', async () => {
    const invalidPayload = {
      payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      total_amount: '50.0000', // Total is 50, but shares sum to 60
      memo: 'Invalid Split',
      recipients: [
        { recipient: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: '30.0000' },
        { recipient: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7', amount: '30.0000' },
      ],
    };

    const res = await request(app).post('/api/settlements').send(invalidPayload);
    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('must equal total_amount');
  });

  it('POST /api/settlements/:id/execute marks settlement completed with sub-payment IDs', async () => {
    // 1. Create
    const createRes = await request(app).post('/api/settlements').send({
      payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      total_amount: '20.0000',
      memo: 'Team Coffee',
      recipients: [
        { recipient: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: '10.0000' },
        { recipient: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7', amount: '10.0000' },
      ],
    });

    const sid = createRes.body.settlement.id;

    // 2. Execute
    const execRes = await request(app)
      .post(`/api/settlements/${sid}/execute`)
      .send({ sub_payment_ids: ['PAY-SUB-1', 'PAY-SUB-2'] });

    expect(execRes.status).toBe(200);
    expect(execRes.body.settlement.status).toBe('COMPLETED');
    expect(execRes.body.settlement.sub_payment_ids.length).toBe(2);
  });
});
