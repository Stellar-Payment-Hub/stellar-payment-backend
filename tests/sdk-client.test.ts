import { describe, it, expect, vi } from 'vitest';
import { StellarPaymentHubClient } from '../packages/client-sdk/src/index';

describe('TypeScript SDK Client Methods', () => {
  it('instantiates client with baseUrl and optional apiKey', () => {
    const client = new StellarPaymentHubClient({
      baseUrl: 'http://localhost:3000',
      apiKey: 'test-api-key',
    });
    expect(client).toBeDefined();
  });

  it('performs typed calculateSplit request successfully', async () => {
    const client = new StellarPaymentHubClient({ baseUrl: 'http://localhost:3000' });
    
    // Mock global fetch
    const mockResponse = {
      status: 'ok',
      totalStroops: '1000000000',
      remainderStroops: '1',
      proofValid: true,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    }));

    const result = await client.calculateSplit('100.00', 3);
    expect(result.status).toBe('ok');
    expect(result.proofValid).toBe(true);

    vi.unstubAllGlobals();
  });
});
