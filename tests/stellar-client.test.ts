import { describe, it, expect } from 'vitest';
import { stellarClient } from '../src/services/stellar-client';
import { feeEstimator } from '../src/services/fee-estimator';

describe('StellarClient & FeeEstimator Services', () => {
  it('returns valid Horizon and RPC server instances', () => {
    expect(stellarClient.getHorizon()).toBeDefined();
    expect(stellarClient.getRpc()).toBeDefined();
  });

  it('retrieves latest ledger sequence without throwing', async () => {
    const sequence = await stellarClient.getLatestLedger();
    expect(typeof sequence).toBe('number');
    expect(sequence).toBeGreaterThan(0);
  });

  it('calculates recommended network fee stats', async () => {
    const stats = await feeEstimator.getFeeStats();
    expect(stats.baseFee).toBe('100');
    expect(stats.minFee).toBeDefined();
    expect(parseFloat(stats.recommendedFeeInXlm)).toBeGreaterThan(0);
  });
});
