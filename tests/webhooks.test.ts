import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { webhookService } from '../src/services/webhook-service';

describe('Webhooks API & Signature Validation', () => {
  it('registers and lists webhook subscriptions', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({ url: 'https://example.com/webhook', events: ['payment.completed'] });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.secret).toBeDefined();

    const listRes = await request(app).get('/api/webhooks');
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  it('generates reproducible HMAC-SHA256 signatures for payloads', () => {
    const payload = JSON.stringify({ amount: '50.0' });
    const secret = 'whsec_test_secret';
    const sig1 = webhookService.signPayload(payload, secret);
    const sig2 = webhookService.signPayload(payload, secret);
    expect(sig1).toBe(sig2);
    expect(sig1.length).toBe(64); // Hex SHA-256
  });
});
