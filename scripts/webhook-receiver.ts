#!/usr/bin/env node
/**
 * Webhook Testing Receiver & Signature Verifier
 * Simulates third-party merchant receiver validating incoming HMAC-SHA256 signatures.
 */
import crypto from 'crypto';

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) return false;
  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expectedSig));
}
