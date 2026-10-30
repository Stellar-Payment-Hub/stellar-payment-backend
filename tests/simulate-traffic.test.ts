import { describe, it, expect } from 'vitest';
import { simulateTraffic, buildSyntheticPaymentPayload } from '../src/utils/simulate-traffic';

describe('Traffic Simulator Engine', () => {
  it('generates valid synthetic payment payload with memo and formatting', () => {
    const payload = buildSyntheticPaymentPayload(42, 'XLM');
    expect(payload.source).toContain('GDEMO');
    expect(payload.asset).toBe('XLM');
    expect(payload.memo).toContain('SIM-TX-42');
    expect(parseFloat(payload.amount)).toBeGreaterThan(0);
  });

  it('runs concurrent batch simulation and computes throughput metrics', async () => {
    let mockCalls = 0;
    const mockExecutor = async () => {
      mockCalls++;
      return true;
    };

    const res = await simulateTraffic(
      {
        concurrency: 5,
        totalTransactions: 15,
        burstIntervalMs: 0,
        asset: 'USDC',
      },
      mockExecutor
    );

    expect(mockCalls).toBe(15);
    expect(res.totalSent).toBe(15);
    expect(res.successful).toBe(15);
    expect(res.failed).toBe(0);
    expect(res.tps).toBeGreaterThan(0);
  });
});
