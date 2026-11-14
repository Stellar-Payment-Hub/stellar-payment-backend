import crypto from 'crypto';
import { Keypair } from '@stellar/stellar-sdk';
import { Payment, PaymentStatus } from '../database/schema';
import { env } from '../config/env';

export interface PaymentReceiptPayload {
  schema_version: '1.0';
  payment_id: string;
  on_chain_id: number;
  creator_address: string;
  recipient_address: string;
  amount: string;
  memo: string;
  status: PaymentStatus;
  contract_address: string;
  transaction_hash: string | null;
  ledger: number | null;
  network: string;
  finalized_at: string;
  issued_at: string;
}

export interface SignedPaymentReceipt {
  payload: PaymentReceiptPayload;
  canonical_payload: string;
  payload_sha256: string;
  algorithm: 'Ed25519';
  signer_public_key: string;
  signature: string;
}

export interface ReceiptVerificationOptions {
  expectedPaymentId?: string;
  expectedSignerPublicKey?: string;
  indexedPayment?: Payment;
}

export interface ReceiptVerificationResult {
  valid: boolean;
  reason?: string;
  payment_id?: string;
  signer_public_key?: string;
  payload_sha256?: string;
}

export class ReceiptMasterKeyMissingError extends Error {
  constructor(message = 'PAYMENT_HUB_MASTER_SECRET is required in production to sign or verify receipts.') {
    super(message);
    this.name = 'ReceiptMasterKeyMissingError';
  }
}

export class PaymentNotFinalizedError extends Error {
  public readonly currentStatus: PaymentStatus;

  constructor(paymentId: string, status: PaymentStatus) {
    super(
      `Payment '${paymentId}' has status '${status}'. Cryptographic proof-of-payment receipts require COMPLETED finality.`
    );
    this.name = 'PaymentNotFinalizedError';
    this.currentStatus = status;
  }
}

function sortValueKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValueKeys);
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortValueKeys(record[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Produces deterministic RFC-8785-style canonical JSON (recursively sorted keys, no extra whitespace).
 */
export function canonicalizeReceiptPayload(payload: PaymentReceiptPayload): string {
  return JSON.stringify(sortValueKeys(payload));
}

/**
 * Computes lowercase hex SHA-256 digest of a canonical JSON string.
 */
export function hashCanonicalPayload(canonicalJson: string): string {
  return crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}

/**
 * Resolves the Payment Hub Ed25519 master signing keypair.
 * Uses PAYMENT_HUB_MASTER_SECRET or RECEIPT_SIGNING_SECRET when configured.
 * Fails closed in production if unconfigured; uses a deterministic seed in dev/test.
 */
export function getReceiptSigningKeypair(): Keypair {
  const configuredSecret =
    process.env.PAYMENT_HUB_MASTER_SECRET?.trim() ||
    process.env.RECEIPT_SIGNING_SECRET?.trim();

  if (configuredSecret) {
    return Keypair.fromSecret(configuredSecret);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new ReceiptMasterKeyMissingError();
  }

  const devSeed = crypto
    .createHash('sha256')
    .update('stellar-payment-hub:receipt-master-ed25519-seed:v1', 'utf8')
    .digest();
  return Keypair.fromRawEd25519Seed(devSeed);
}

export function buildReceiptPayload(
  payment: Payment,
  issuedAt = new Date().toISOString()
): PaymentReceiptPayload {
  return {
    schema_version: '1.0',
    payment_id: payment.id,
    on_chain_id: payment.on_chain_id,
    creator_address: payment.creator_address,
    recipient_address: payment.recipient_address,
    amount: payment.amount,
    memo: payment.memo || '',
    status: payment.status,
    contract_address: payment.contract_address,
    transaction_hash: payment.transaction_hash ?? null,
    ledger: payment.ledger ?? null,
    network: process.env.STELLAR_NETWORK || env.stellarNetwork,
    finalized_at: payment.updated_at,
    issued_at: issuedAt,
  };
}

/**
 * Generates an Ed25519-signed proof-of-payment receipt for a COMPLETED payment.
 */
export function generatePaymentReceipt(
  payment: Payment,
  signingKeypair: Keypair = getReceiptSigningKeypair(),
  issuedAt?: string
): SignedPaymentReceipt {
  if (payment.status !== 'COMPLETED') {
    throw new PaymentNotFinalizedError(payment.id, payment.status);
  }

  const payload = buildReceiptPayload(payment, issuedAt);
  const canonicalPayload = canonicalizeReceiptPayload(payload);
  const payloadSha256 = hashCanonicalPayload(canonicalPayload);
  const messageBytes = Buffer.from(canonicalPayload, 'utf8');
  const signatureBytes = signingKeypair.sign(messageBytes);

  return {
    payload,
    canonical_payload: canonicalPayload,
    payload_sha256: payloadSha256,
    algorithm: 'Ed25519',
    signer_public_key: signingKeypair.publicKey(),
    signature: Buffer.from(signatureBytes).toString('hex'),
  };
}

function decodeEd25519Signature(signature: string): Buffer | null {
  if (typeof signature !== 'string' || signature.length === 0) {
    return null;
  }

  if (/^[0-9a-fA-F]{128}$/.test(signature)) {
    return Buffer.from(signature, 'hex');
  }

  if (/^[A-Za-z0-9+/]{86}==$/.test(signature)) {
    const decoded = Buffer.from(signature, 'base64');
    return decoded.length === 64 ? decoded : null;
  }

  return null;
}

function isValidReceiptPayloadShape(payload: unknown): payload is PaymentReceiptPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }
  const p = payload as Record<string, unknown>;
  return (
    p.schema_version === '1.0' &&
    typeof p.payment_id === 'string' &&
    p.payment_id.length > 0 &&
    typeof p.on_chain_id === 'number' &&
    typeof p.creator_address === 'string' &&
    typeof p.recipient_address === 'string' &&
    typeof p.amount === 'string' &&
    typeof p.memo === 'string' &&
    typeof p.status === 'string' &&
    typeof p.contract_address === 'string' &&
    (p.transaction_hash === null || typeof p.transaction_hash === 'string') &&
    (p.ledger === null || typeof p.ledger === 'number') &&
    typeof p.network === 'string' &&
    typeof p.finalized_at === 'string' &&
    typeof p.issued_at === 'string'
  );
}

/**
 * Validates a signed proof-of-payment receipt using Ed25519 signature verification
 * over the canonicalized payment JSON payload.
 */
export function verifyPaymentReceipt(
  receiptInput: Partial<SignedPaymentReceipt>,
  options: ReceiptVerificationOptions = {}
): ReceiptVerificationResult {
  if (!receiptInput || typeof receiptInput !== 'object') {
    return { valid: false, reason: 'Receipt object is required.' };
  }

  const { payload, signature, signer_public_key, canonical_payload, payload_sha256, algorithm } =
    receiptInput;

  if (algorithm !== undefined && algorithm !== 'Ed25519') {
    return { valid: false, reason: `Unsupported signature algorithm '${String(algorithm)}'.` };
  }

  if (!isValidReceiptPayloadShape(payload)) {
    return { valid: false, reason: 'Invalid or incomplete receipt payload structure.' };
  }

  if (payload.status !== 'COMPLETED') {
    return {
      valid: false,
      reason: `Receipt status '${payload.status}' does not represent finalized COMPLETED payment.`,
      payment_id: payload.payment_id,
    };
  }

  if (options.expectedPaymentId && payload.payment_id !== options.expectedPaymentId) {
    return {
      valid: false,
      reason: `Receipt payment_id '${payload.payment_id}' does not match expected '${options.expectedPaymentId}'.`,
      payment_id: payload.payment_id,
    };
  }

  if (typeof signer_public_key !== 'string' || signer_public_key.length === 0) {
    return { valid: false, reason: 'Missing signer_public_key.', payment_id: payload.payment_id };
  }

  if (
    options.expectedSignerPublicKey &&
    signer_public_key !== options.expectedSignerPublicKey
  ) {
    return {
      valid: false,
      reason: 'Receipt signer_public_key does not match Payment Hub master public key.',
      payment_id: payload.payment_id,
      signer_public_key,
    };
  }

  if (typeof signature !== 'string' || signature.length === 0) {
    return {
      valid: false,
      reason: 'Missing Ed25519 signature.',
      payment_id: payload.payment_id,
      signer_public_key,
    };
  }

  const sigBytes = decodeEd25519Signature(signature);
  if (!sigBytes) {
    return {
      valid: false,
      reason: 'Malformed Ed25519 signature encoding (expected 64-byte hex or base64).',
      payment_id: payload.payment_id,
      signer_public_key,
    };
  }

  const recomputedCanonical = canonicalizeReceiptPayload(payload);
  const recomputedSha256 = hashCanonicalPayload(recomputedCanonical);

  if (canonical_payload !== undefined && canonical_payload !== recomputedCanonical) {
    return {
      valid: false,
      reason: 'Provided canonical_payload does not match canonicalized payload.',
      payment_id: payload.payment_id,
      signer_public_key,
      payload_sha256: recomputedSha256,
    };
  }

  if (payload_sha256 !== undefined && payload_sha256.toLowerCase() !== recomputedSha256) {
    return {
      valid: false,
      reason: 'Provided payload_sha256 digest does not match canonical payload hash.',
      payment_id: payload.payment_id,
      signer_public_key,
      payload_sha256: recomputedSha256,
    };
  }

  let verifierKeypair: Keypair;
  try {
    verifierKeypair = Keypair.fromPublicKey(signer_public_key);
  } catch {
    return {
      valid: false,
      reason: 'Invalid Stellar Ed25519 public key in signer_public_key.',
      payment_id: payload.payment_id,
      signer_public_key,
    };
  }

  let signatureValid = false;
  try {
    signatureValid = verifierKeypair.verify(Buffer.from(recomputedCanonical, 'utf8'), sigBytes);
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return {
      valid: false,
      reason: 'Ed25519 signature verification failed for canonical payment payload.',
      payment_id: payload.payment_id,
      signer_public_key,
      payload_sha256: recomputedSha256,
    };
  }

  if (options.indexedPayment) {
    const p = options.indexedPayment;
    if (
      p.status !== 'COMPLETED' ||
      p.creator_address !== payload.creator_address ||
      p.recipient_address !== payload.recipient_address ||
      p.amount !== payload.amount ||
      p.contract_address !== payload.contract_address ||
      (p.transaction_hash ?? null) !== payload.transaction_hash
    ) {
      return {
        valid: false,
        reason: 'Receipt payload does not match indexed finalized payment record.',
        payment_id: payload.payment_id,
        signer_public_key,
        payload_sha256: recomputedSha256,
      };
    }
  }

  return {
    valid: true,
    payment_id: payload.payment_id,
    signer_public_key,
    payload_sha256: recomputedSha256,
  };
}
