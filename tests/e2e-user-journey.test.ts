import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('End-to-End User Journey (Connect -> Invoice -> Settle -> Verify)', () => {
  it('completes seamless merchant workflow across all core subsystems', async () => {
    // 1. Merchant creates payment invoice
    const invoiceRes = await request(app)
      .post('/api/payment-requests')
      .send({
        requester: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '250.0000',
        memo: 'E2E Full Merchant Invoice',
        expiresInHours: 24,
      });
    expect(invoiceRes.status).toBe(201);
    expect(invoiceRes.body.status).toBe('ok');
    const requestId = invoiceRes.body.request.id;

    // 2. Client pays invoice
    const payRes = await request(app)
      .patch(`/api/payment-requests/${requestId}/pay`)
      .send({
        paid_by: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        transaction_hash: 'feedface0123456789abcdef0123456789abcdef0123456789abcdef01234567',
      });
    expect(payRes.status).toBe(200);
    expect(payRes.body.request.status).toBe('PAID');

    // 3. Merchant triggers split settlement for suppliers
    const settleRes = await request(app)
      .post('/api/settlements')
      .send({
        payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        total_amount: '250.0000',
        memo: 'Supplier Payouts',
        recipients: [
          { recipient: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: '150.0000' },
          { recipient: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7', amount: '100.0000' },
        ],
      });
    expect(settleRes.status).toBe(201);
    expect(settleRes.body.settlement.id).toBeDefined();

    // 4. Verify transaction history records
    const txRes = await request(app).get('/api/transactions');
    expect(txRes.status).toBe(200);
    expect(Array.isArray(txRes.body.transactions)).toBe(true);
    expect(txRes.body.transactions.length).toBeGreaterThan(0);
  });
});
