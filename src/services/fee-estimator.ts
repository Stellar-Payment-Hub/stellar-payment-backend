import { stellarClient } from './stellar-client';

export interface FeeStats {
  minFee: string; // Stroops
  modeFee: string;
  p90Fee: string;
  baseFee: string;
  recommendedFeeInXlm: string;
  updatedAt: string;
}

export class FeeEstimator {
  private cachedFee: FeeStats | null = null;
  private lastFetched: number = 0;
  private readonly CACHE_TTL_MS = 15000; // 15 seconds

  public async getFeeStats(): Promise<FeeStats> {
    const now = Date.now();
    if (this.cachedFee && now - this.lastFetched < this.CACHE_TTL_MS) {
      return this.cachedFee;
    }

    try {
      const horizon = stellarClient.getHorizon();
      const stats = await horizon.feeStats();
      const min = stats.fee_charged.min || '100';
      const mode = stats.fee_charged.mode || '100';
      const p90 = stats.fee_charged.p90 || '200';

      const recommendedStroops = parseInt(p90, 10);
      const recommendedXlm = (recommendedStroops / 10000000).toFixed(7);

      this.cachedFee = {
        minFee: min,
        modeFee: mode,
        p90Fee: p90,
        baseFee: '100',
        recommendedFeeInXlm: recommendedXlm,
        updatedAt: new Date().toISOString(),
      };
      this.lastFetched = now;
      return this.cachedFee;
    } catch {
      // Offline fallback: Standard 100 Stroops base fee
      return {
        minFee: '100',
        modeFee: '100',
        p90Fee: '150',
        baseFee: '100',
        recommendedFeeInXlm: '0.0000150',
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export const feeEstimator = new FeeEstimator();
