import { describe, it, expect } from 'vitest';
import { validatePaymentRecord, validateSettlementConfig } from '../src/schemas/contract-schemas';
import { calculateDeterministicSplit } from '../src/utils/math-split';
import { validateEnvironment } from '../scripts/validate-env';
import { getContractError } from '../src/constants/error-dictionary';
import { classifyStrKey } from '../src/utils/strkey-validator';
import { toStroops, fromStroops } from '../src/utils/stroop-converter';
import { createRateLimitKey } from '../src/utils/rate-limit-keys';
import { generateTraceparent, parseTraceparent } from '../src/utils/trace-context';
import { redactSensitiveData } from '../src/utils/log-formatter';

describe('Batch 10: Codebase Types, Schemas & Tooling', () => {
  const VALID_ADDR_1 = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
  const VALID_ADDR_2 = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

  it('Item 182: validates payment record schema', () => {
    const valid = validatePaymentRecord({
      payer: VALID_ADDR_1,
      payee: VALID_ADDR_2,
      amount: '50.00',
    });
    expect(valid.isValid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const invalid = validatePaymentRecord({
      payer: 'bad-addr',
      amount: '-5',
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it('Item 183: proves 0-loss remainder math calculation', () => {
    // 100 Stroops / 3 = 33, 33, 33 + 1 remainder dust
    const result = calculateDeterministicSplit('0.0000100', 3);
    expect(result.proofValid).toBe(true);
    expect(result.totalStroops).toBe(100n);
    expect(result.baseStroopsPerRecipient).toBe(33n);
    expect(result.remainderStroops).toBe(1n);
    expect(result.recipients[0].stroops).toBe(34n);
    expect(result.recipients[0].isRemainderRecipient).toBe(true);
    expect(result.recipients[1].stroops).toBe(33n);
  });

  it('Item 184: validates environment variables', () => {
    const valid = validateEnvironment({
      STELLAR_NETWORK: 'testnet',
      PORT: '4000',
      HORIZON_URL: 'https://horizon-testnet.stellar.org',
    });
    expect(valid.valid).toBe(true);

    const invalid = validateEnvironment({
      STELLAR_NETWORK: 'unsupported_chain',
      PORT: 'not-a-port',
    });
    expect(invalid.valid).toBe(false);
  });

  it('Item 185: retrieves friendly error info from dictionary', () => {
    const err = getContractError(105);
    expect(err.name).toBe('ContractPaused');
    expect(err.httpStatus).toBe(503);

    const unknownErr = getContractError(999);
    expect(unknownErr.httpStatus).toBe(500);
  });

  it('Item 192: classifies StrKey types accurately', () => {
    expect(classifyStrKey(VALID_ADDR_1)).toBe('Account');
    expect(classifyStrKey('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC')).toBe('Contract');
    expect(classifyStrKey('S' + VALID_ADDR_1.substring(1))).toBe('Secret');
    expect(classifyStrKey('not-a-key')).toBe('Invalid');
  });

  it('Item 193: converts stroops without floating point drift', () => {
    expect(toStroops('10.5')).toBe(105000000n);
    expect(fromStroops(105000000n)).toBe('10.5');
  });

  it('Item 196: generates rate limit keys with SHA-256 hash', () => {
    const ipKey = createRateLimitKey('1.2.3.4');
    expect(ipKey).toBe('rl:ip:1.2.3.4:global');

    const authKey = createRateLimitKey('1.2.3.4', 'Bearer secret-jwt-token');
    expect(authKey).toContain('rl:auth:');
  });

  it('Item 197: generates and parses W3C TraceContext', () => {
    const header = generateTraceparent();
    const parsed = parseTraceparent(header);
    expect(parsed).not.toBeNull();
    expect(parsed?.sampled).toBe(true);
    expect(parsed?.traceId).toHaveLength(32);
  });

  it('Item 198: redacts Stellar S... secret keys from logs', () => {
    const sensitive = 'Error connecting with key SB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVNAAAAABBB on node';
    const clean = redactSensitiveData(sensitive);
    expect(clean).not.toContain('SB37');
    expect(clean).toContain('[REDACTED_STELLAR_SECRET]');
  });
});
