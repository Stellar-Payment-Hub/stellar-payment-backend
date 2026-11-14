import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { Keypair } from '@stellar/stellar-sdk';
import { app } from '../src/app';
import { paymentRepository } from '../src/database/repository';
import {
  canonicalizeReceiptPayload,
  generatePaymentReceipt,
  verifyPaymentReceipt,
  getReceiptSigningKeypair,
  PaymentNotFinalizedError,
  ReceiptMasterKeyMissingError,
  PaymentReceiptPayload,
} from '../src/services/receipt-service';
import { verifyReceiptOffline, runVerifyReceiptCli } from '../scripts/verify-receipt';

describe('Ed25519 Signed Proof-of-Payment Receipts (#19)', () => {
  const originalMasterSecret = process.env.PAYMENT_HUB_MASTER_SECRET;
  const originalReceiptSecret = process.env.RECEIPT_SIGNING_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalMasterSecret === undefined) {
      delete process.env.PAYMENT_HUB_MASTER_SECRET;
    } else {
      process.env.PAYMENT_HUB_MASTER_SECRET = originalMasterSecret;
    }

    if (originalReceiptSecret === undefined) {
      delete process.env.RECEIPT_SIGNING_SECRET;
    } else {
      process.env.RECEIPT_SIGNING_SECRET = originalReceiptSecret;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('produces identical canonical JSON regardless of object property insertion order', () => {
    const payloadA: PaymentReceiptPayload = {
      schema_version: '1.0',
      payment_id: 'PAY-002',
      on_chain_id: 2,
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipient_address: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7',
      amount: '10.0000000',
      memo: 'Domain Renewal',
      status: 'COMPLETED',
      contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
      transaction_hash: '9a7b6c5d4e3f210987654321fedcba0987654321fedcba0987654321fedcba09',
      ledger: 104100,
      network: 'testnet',
      finalized_at: '2026-11-10T00:00:00.000Z',
      issued_at: '2026-11-10T00:01:00.000Z',
    };

    const reordered = {
      issued_at: payloadA.issued_at,
      amount: payloadA.amount,
      status: payloadA.status,
      payment_id: payloadA.payment_id,
      ledger: payloadA.ledger,
      transaction_hash: payloadA.transaction_hash,
      recipient_address: payloadA.recipient_address,
      creator_address: payloadA.creator_address,
      contract_address: payloadA.contract_address,
      memo: payloadA.memo,
      network: payloadA.network,
      finalized_at: payloadA.finalized_at,
      on_chain_id: payloadA.on_chain_id,
      schema_version: payloadA.schema_version,
    } as PaymentReceiptPayload;

    expect(canonicalizeReceiptPayload(payloadA)).toBe(canonicalizeReceiptPayload(reordered));
  });

  it('signs finalized payment with Ed25519 Keypair and verifies both hex and base64 signatures', () => {
    const completed = paymentRepository.findById('PAY-002');
    expect(completed).toBeDefined();

    const customMaster = Keypair.random();
    const receipt = generatePaymentReceipt(
      completed!,
      customMaster,
      '2026-11-14T12:00:00.000Z'
    );

    expect(receipt.algorithm).toBe('Ed25519');
    expect(receipt.signer_public_key).toBe(customMaster.publicKey());
    expect(receipt.signature).toMatch(/^[0-9a-f]{128}$/);
    expect(receipt.payload_sha256).toMatch(/^[0-9a-f]{64}$/);

    const hexResult = verifyPaymentReceipt(receipt, {
      expectedPaymentId: 'PAY-002',
      expectedSignerPublicKey: customMaster.publicKey(),
      indexedPayment: completed,
    });
    expect(hexResult.valid).toBe(true);

    // Base64 signature encoding is also accepted seamlessly
    const base64Sig = Buffer.from(receipt.signature, 'hex').toString('base64');
    const b64Result = verifyPaymentReceipt(
      { ...receipt, signature: base64Sig },
      { expectedSignerPublicKey: customMaster.publicKey() }
    );
    expect(b64Result.valid).toBe(true);
  });

  it('refuses to generate receipts for non-COMPLETED payments and fails closed in production without secret', () => {
    const pending = paymentRepository.findById('PAY-001');
    expect(pending).toBeDefined();
    expect(() => generatePaymentReceipt(pending!)).toThrow(PaymentNotFinalizedError);

    process.env.NODE_ENV = 'production';
    delete process.env.PAYMENT_HUB_MASTER_SECRET;
    delete process.env.RECEIPT_SIGNING_SECRET;
    expect(() => getReceiptSigningKeypair()).toThrow(ReceiptMasterKeyMissingError);

    const prodMaster = Keypair.random();
    process.env.PAYMENT_HUB_MASTER_SECRET = prodMaster.secret();
    expect(getReceiptSigningKeypair().publicKey()).toBe(prodMaster.publicKey());
  });

  it('GET /api/payments/receipt-public-key returns active Ed25519 master public key', async () => {
    const res = await request(app).get('/api/payments/receipt-public-key');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.algorithm).toBe('Ed25519');
    expect(res.body.signer_public_key).toMatch(/^G[A-Z2-7]{55}$/);
  });

  it('GET /api/payments/:id/receipt issues receipt for COMPLETED payment and rejects PENDING/missing', async () => {
    const missingRes = await request(app).get('/api/payments/PAY-99999/receipt');
    expect(missingRes.status).toBe(404);

    const pendingRes = await request(app).get('/api/payments/PAY-001/receipt');
    expect(pendingRes.status).toBe(409);
    expect(pendingRes.body.payment_status).toBe('PENDING');

    const okRes = await request(app).get('/api/payments/PAY-002/receipt');
    expect(okRes.status).toBe(200);
    expect(okRes.body.status).toBe('ok');
    expect(okRes.body.receipt.payload.payment_id).toBe('PAY-002');
    expect(okRes.body.receipt.payload.status).toBe('COMPLETED');
    expect(okRes.body.receipt.algorithm).toBe('Ed25519');
  });

  it('POST /api/payments/:id/verify-receipt validates authentic receipt and rejects tampered payloads or forged signatures', async () => {
    const issueRes = await request(app).get('/api/payments/PAY-002/receipt');
    expect(issueRes.status).toBe(200);
    const receipt = issueRes.body.receipt;

    // 1. Valid verification (wrapped in { receipt })
    const validRes = await request(app)
      .post('/api/payments/PAY-002/verify-receipt')
      .send({ receipt });
    expect(validRes.status).toBe(200);
    expect(validRes.body.valid).toBe(true);
    expect(validRes.body.payment_id).toBe('PAY-002');

    // 2. Valid verification when top-level payload keys are reordered and canonical_payload is omitted
    const reorderedPayload = {
      issued_at: receipt.payload.issued_at,
      finalized_at: receipt.payload.finalized_at,
      network: receipt.payload.network,
      ledger: receipt.payload.ledger,
      transaction_hash: receipt.payload.transaction_hash,
      contract_address: receipt.payload.contract_address,
      status: receipt.payload.status,
      memo: receipt.payload.memo,
      amount: receipt.payload.amount,
      recipient_address: receipt.payload.recipient_address,
      creator_address: receipt.payload.creator_address,
      on_chain_id: receipt.payload.on_chain_id,
      payment_id: receipt.payload.payment_id,
      schema_version: receipt.payload.schema_version,
    };
    const reorderedRes = await request(app)
      .post('/api/payments/PAY-002/verify-receipt')
      .send({
        payload: reorderedPayload,
        signer_public_key: receipt.signer_public_key,
        signature: receipt.signature,
      });
    expect(reorderedRes.status).toBe(200);
    expect(reorderedRes.body.valid).toBe(true);

    // 3. Tampered amount fails cryptographic check
    const tamperedAmount = {
      ...receipt,
      canonical_payload: undefined,
      payload_sha256: undefined,
      payload: { ...receipt.payload, amount: '99999.0000000' },
    };
    const tamperedRes = await request(app)
      .post('/api/payments/PAY-002/verify-receipt')
      .send({ receipt: tamperedAmount });
    expect(tamperedRes.status).toBe(200);
    expect(tamperedRes.body.valid).toBe(false);
    expect(tamperedRes.body.reason).toContain('Ed25519 signature verification failed');

    // 4. Forged signature by rogue keypair fails master key check
    const rogueKeypair = Keypair.random();
    const completed = paymentRepository.findById('PAY-002')!;
    const rogueReceipt = generatePaymentReceipt(completed, rogueKeypair);
    const rogueRes = await request(app)
      .post('/api/payments/PAY-002/verify-receipt')
      .send({ receipt: rogueReceipt });
    expect(rogueRes.status).toBe(200);
    expect(rogueRes.body.valid).toBe(false);
    expect(rogueRes.body.reason).toContain('master public key');

    // 5. URL parameter mismatch fails check
    const wrongIdRes = await request(app)
      .post('/api/payments/PAY-001/verify-receipt')
      .send({ receipt });
    expect(wrongIdRes.status).toBe(200);
    expect(wrongIdRes.body.valid).toBe(false);

    // 6. Missing payload/signature returns 400
    const badReqRes = await request(app)
      .post('/api/payments/PAY-002/verify-receipt')
      .send({});
    expect(badReqRes.status).toBe(400);
    expect(badReqRes.body.valid).toBe(false);
  });

  it('independently verifies receipt offline via scripts/verify-receipt.ts (API & CLI)', async () => {
    const issueRes = await request(app).get('/api/payments/PAY-002/receipt');
    const receipt = issueRes.body.receipt;

    // Programmatic offline check
    const offlineOk = verifyReceiptOffline(
      JSON.stringify(receipt),
      receipt.signer_public_key
    );
    expect(offlineOk.valid).toBe(true);
    expect(offlineOk.paymentId).toBe('PAY-002');
    expect(offlineOk.payloadSha256).toBe(receipt.payload_sha256);

    // Offline tamper check
    const tamperedJson = JSON.stringify({
      ...receipt,
      canonical_payload: undefined,
      payload_sha256: undefined,
      payload: { ...receipt.payload, memo: 'Tampered Memo' },
    });
    const offlineTampered = verifyReceiptOffline(tamperedJson, receipt.signer_public_key);
    expect(offlineTampered.valid).toBe(false);

    // CLI file verification check
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sph-receipt-'));
    const validPath = path.join(tmpDir, 'valid-receipt.json');
    const invalidPath = path.join(tmpDir, 'invalid-receipt.json');

    try {
      fs.writeFileSync(validPath, JSON.stringify(receipt, null, 2), 'utf8');
      fs.writeFileSync(invalidPath, tamperedJson, 'utf8');

      const okCode = runVerifyReceiptCli([
        validPath,
        '--public-key',
        receipt.signer_public_key,
      ]);
      expect(okCode).toBe(0);

      const wrongKeyCode = runVerifyReceiptCli([
        validPath,
        '--public-key',
        Keypair.random().publicKey(),
      ]);
      expect(wrongKeyCode).toBe(1);

      const badCode = runVerifyReceiptCli([invalidPath]);
      expect(badCode).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
