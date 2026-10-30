import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('End-to-End User Journey (Connect -> Invoice -> Settle -> Verify)', () => {
  it('completes seamless merchant workflow across all core subsystems', async () => {
    // 1. Merchant creates payment invoice
    const invoiceRes = await request(app)
      .post('/api/payment-requests')
      .send({
        title: 'E2E Full Merchant Invoice',
        amount: '250.00',
        asset: 'USDC',
        recipient: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      });
    expect(invoiceRes.status).toBe(201);
    const requestId = invoiceRes.body.data.id;

    // 2. Client pays invoice
    const payRes = await request(app)
      .patch(`/api/payment-requests/${requestId}/pay`)
      .send({
        transaction_hash: 'tx_e2e_user_journey_confirmed_123',
      });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.status).toBe('FULFILLED');

    // 3. Merchant triggers split settlement for suppliers
    const settleRes = await request(app)
      .post('/api/settlements')
      .send({
        total_amount: '250.00',
        asset: 'USDC',
        recipients: [
          { address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', share_amount: '150.00' },
          { address: 'GUSERDEMOADDRESS22222222222222222222222222222222222222222', share_amount: '100.00' },
        ],
      });
    expect(settleRes.status).toBe(201);
    const settleId = settleRes.body.data.id;

    // 4. Verify transaction history records
    const txRes = await request(app).get('/api/transactions');
    expect(txRes.status).toBe(200);
    expect(txRes.body.data.length).toBeGreaterThan(0);
  });
});
