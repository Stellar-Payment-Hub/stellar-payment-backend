import { describe, it, expect, vi } from 'vitest';
import { setupTestnetAccount } from '../scripts/setup-testnet-account';

describe('Testnet Account Setup Helper', () => {
  it('funds account via friendbot and returns starting balance', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ ok: true });
    const res = await setupTestnetAccount('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', mockFetcher);

    expect(res.funded).toBe(true);
    expect(res.startingBalance).toBe('10000.0000000');
    expect(res.trustlinesAdded).toContain('USDC');
    expect(mockFetcher).toHaveBeenCalledWith(expect.stringContaining('friendbot.stellar.org'));
  });
});
