import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { isValidStellarAddress, isValidContractAddress, truncateAddress } from '../src/utils/stellar-address';

describe('Address Validation & Security Headers', () => {
  it('validates Ed25519 account addresses and contracts correctly', () => {
    expect(isValidStellarAddress('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')).toBe(true);
    expect(isValidStellarAddress('INVALID_ADDR')).toBe(false);
    expect(isValidContractAddress('CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S')).toBe(true);
  });

  it('truncates addresses for human readability', () => {
    const truncated = truncateAddress('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    expect(truncated).toBe('GBBD...FLA5');
  });

  it('attaches security headers to responses', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
});
