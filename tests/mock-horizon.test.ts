import { describe, it, expect } from 'vitest';
import { MockHorizonServer } from '../src/utils/mock-horizon';

describe('Mock Horizon Server Harness', () => {
  it('seeds and retrieves mock account with native and alphanum balances', () => {
    const server = new MockHorizonServer();
    const addr = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    
    server.seedAccount(addr, [
      { balance: '1000.0000000' },
      { code: 'USDC', balance: '500.00' }
    ]);

    const acc = server.getAccount(addr);
    expect(acc.id).toBe(addr);
    expect(acc.balances.length).toBe(2);
    expect(acc.balances[0].asset_type).toBe('native');
    expect(acc.balances[1].asset_code).toBe('USDC');
  });

  it('throws 404 error when querying unseeded account', () => {
    const server = new MockHorizonServer();
    expect(() => server.getAccount('GUNKNOWN')).toThrow('Horizon 404: Account not found');
  });

  it('returns valid network fee statistics', () => {
    const server = new MockHorizonServer();
    const stats = server.getFeeStats();
    expect(stats.min).toBe('100');
    expect(stats.mode).toBe('100');
  });
});
