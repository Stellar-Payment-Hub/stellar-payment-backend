import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../scripts/webhook-receiver';

describe('Webhook Receiver & Signature Validation', () => {
  const secret = 'super-secret-hmac-key-2026';
  const payload = JSON.stringify({ event: 'payment.completed', id: 'PAY-101', amount: '150.00' });

  it('validates authentic webhook HMAC signature', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = verifyWebhookSignature(payload, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it('rejects tampered webhook payload signature', () => {
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const tamperedPayload = payload.replace('150.00', '9999.00');
    const isValid = verifyWebhookSignature(tamperedPayload, validSignature, secret);
    expect(isValid).toBe(false);
  });

  it('rejects empty signature or missing secret', () => {
    expect(verifyWebhookSignature(payload, '', secret)).toBe(false);
    expect(verifyWebhookSignature(payload, 'sig', '')).toBe(false);
  });
});
