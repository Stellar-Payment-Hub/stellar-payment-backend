#!/usr/bin/env node
/**
 * Standalone Offline Ed25519 Payment Receipt Verifier
 *
 * Independently verifies cryptographically signed Stellar Payment Hub receipts
 * without requiring network access, Express server startup, or database state.
 *
 * Usage:
 *   npx tsx scripts/verify-receipt.ts <path-to-receipt.json> [--public-key G...]
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Keypair } from '@stellar/stellar-sdk';

export interface OfflineReceiptDocument {
  payload: Record<string, unknown>;
  canonical_payload?: string;
  payload_sha256?: string;
  algorithm?: string;
  signer_public_key: string;
  signature: string;
}

export interface OfflineVerificationOutcome {
  valid: boolean;
  reason?: string;
  paymentId?: string;
  signerPublicKey?: string;
  canonicalPayload?: string;
  payloadSha256?: string;
}

function canonicalSort(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalSort);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = canonicalSort(obj[key]);
    }
    return sorted;
  }
  return value;
}

export function canonicalizeOfflinePayload(payload: Record<string, unknown>): string {
  return JSON.stringify(canonicalSort(payload));
}

function parseSignatureBytes(signature: string): Buffer | null {
  if (/^[0-9a-fA-F]{128}$/.test(signature)) {
    return Buffer.from(signature, 'hex');
  }
  if (/^[A-Za-z0-9+/]{86}==$/.test(signature)) {
    const buf = Buffer.from(signature, 'base64');
    return buf.length === 64 ? buf : null;
  }
  return null;
}

export function verifyReceiptOffline(
  rawReceipt: string | Record<string, unknown>,
  expectedPublicKey?: string
): OfflineVerificationOutcome {
  let parsed: Record<string, unknown>;

  if (typeof rawReceipt === 'string') {
    try {
      parsed = JSON.parse(rawReceipt) as Record<string, unknown>;
    } catch {
      return { valid: false, reason: 'Invalid JSON input.' };
    }
  } else if (rawReceipt && typeof rawReceipt === 'object') {
    parsed = rawReceipt;
  } else {
    return { valid: false, reason: 'Receipt input must be a JSON string or object.' };
  }

  const doc = (
    parsed.receipt && typeof parsed.receipt === 'object' ? parsed.receipt : parsed
  ) as Partial<OfflineReceiptDocument>;

  if (!doc.payload || typeof doc.payload !== 'object' || Array.isArray(doc.payload)) {
    return { valid: false, reason: 'Missing or invalid receipt payload object.' };
  }

  if (doc.algorithm !== undefined && doc.algorithm !== 'Ed25519') {
    return { valid: false, reason: `Unsupported algorithm '${String(doc.algorithm)}'.` };
  }

  const paymentId =
    typeof doc.payload.payment_id === 'string' ? doc.payload.payment_id : undefined;

  if (doc.payload.status !== 'COMPLETED') {
    return {
      valid: false,
      reason: `Receipt status '${String(doc.payload.status)}' is not COMPLETED.`,
      paymentId,
    };
  }

  if (typeof doc.signer_public_key !== 'string' || doc.signer_public_key.length === 0) {
    return { valid: false, reason: 'Missing signer_public_key.', paymentId };
  }

  if (expectedPublicKey && doc.signer_public_key !== expectedPublicKey) {
    return {
      valid: false,
      reason: 'Receipt signer_public_key does not match expected master public key.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
    };
  }

  if (typeof doc.signature !== 'string' || doc.signature.length === 0) {
    return {
      valid: false,
      reason: 'Missing Ed25519 signature.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
    };
  }

  const sigBytes = parseSignatureBytes(doc.signature);
  if (!sigBytes) {
    return {
      valid: false,
      reason: 'Invalid Ed25519 signature encoding.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
    };
  }

  const canonicalPayload = canonicalizeOfflinePayload(doc.payload);
  const payloadSha256 = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');

  if (doc.canonical_payload !== undefined && doc.canonical_payload !== canonicalPayload) {
    return {
      valid: false,
      reason: 'canonical_payload mismatch.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
      canonicalPayload,
      payloadSha256,
    };
  }

  if (
    doc.payload_sha256 !== undefined &&
    doc.payload_sha256.toLowerCase() !== payloadSha256
  ) {
    return {
      valid: false,
      reason: 'payload_sha256 digest mismatch.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
      canonicalPayload,
      payloadSha256,
    };
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromPublicKey(doc.signer_public_key);
  } catch {
    return {
      valid: false,
      reason: 'Invalid Stellar Ed25519 public key.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
    };
  }

  let verified = false;
  try {
    verified = keypair.verify(Buffer.from(canonicalPayload, 'utf8'), sigBytes);
  } catch {
    verified = false;
  }

  if (!verified) {
    return {
      valid: false,
      reason: 'Ed25519 cryptographic signature verification failed.',
      paymentId,
      signerPublicKey: doc.signer_public_key,
      canonicalPayload,
      payloadSha256,
    };
  }

  return {
    valid: true,
    paymentId,
    signerPublicKey: doc.signer_public_key,
    canonicalPayload,
    payloadSha256,
  };
}

export function runVerifyReceiptCli(args: string[]): number {
  let filePath: string | undefined;
  let expectedPublicKey: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--public-key' && args[i + 1]) {
      expectedPublicKey = args[i + 1];
      i += 1;
    } else if (!arg.startsWith('--') && !filePath) {
      filePath = arg;
    }
  }

  if (!filePath) {
    console.error('Usage: verify-receipt <receipt.json> [--public-key <G...>]');
    return 1;
  }

  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: Receipt file not found at '${resolved}'.`);
    return 1;
  }

  const rawContent = fs.readFileSync(resolved, 'utf8');
  const outcome = verifyReceiptOffline(rawContent, expectedPublicKey);

  if (!outcome.valid) {
    console.error(`INVALID RECEIPT: ${outcome.reason || 'Verification failed.'}`);
    return 1;
  }

  console.log(
    JSON.stringify({
      status: 'verified',
      valid: true,
      payment_id: outcome.paymentId,
      signer_public_key: outcome.signerPublicKey,
      payload_sha256: outcome.payloadSha256,
    })
  );
  return 0;
}

if (require.main === module) {
  const exitCode = runVerifyReceiptCli(process.argv.slice(2));
  process.exit(exitCode);
}
