import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('SEP-0007 & QR Code API', () => {
  it('POST /api/stellar/sep0007-uri generates standard Stellar payment link', async () => {
    const res = await request(app)
      .post('/api/stellar/sep0007-uri')
      .send({
        destination: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '25.0',
        memo: 'Invoice #1042',
      });
    expect(res.status).toBe(200);
    expect(res.body.uri).toContain('web+stellar:pay?destination=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    expect(res.body.uri).toContain('amount=25.0');
    expect(res.body.uri).toContain('memo=Invoice%20%231042');
  });

  it('GET /api/stellar/qrcode returns SVG image asset', async () => {
    const res = await request(app)
      .get('/api/stellar/qrcode')
      .query({ data: 'web+stellar:pay?destination=GBBD' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/svg+xml');
    const content = res.text || (res.body ? res.body.toString() : '');
    expect(content).toContain('<svg');
  });
});
