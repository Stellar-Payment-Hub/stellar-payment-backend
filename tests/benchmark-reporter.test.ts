import { describe, it, expect } from 'vitest';
import { estimateResourceCost, calculateBatchGasUsage } from '../src/utils/benchmark-gas';
import { generateBenchmarkMarkdownReport } from '../src/utils/benchmark-reporter';

describe('Gas Benchmark & Markdown Reporter', () => {
  it('retrieves gas resource profiles for contract methods', () => {
    const profile = estimateResourceCost('create_payment');
    expect(profile.cpuInstructions).toBeGreaterThan(0);
    expect(profile.memoryBytes).toBeGreaterThan(0);
    expect(profile.estimatedFeeStroops).toBe(25000);
  });

  it('computes batch gas and fee aggregation in Stroops and XLM', () => {
    const batch = calculateBatchGasUsage(['create_payment', 'complete_payment']);
    expect(batch.totalCpu).toBe(2200000);
    expect(batch.totalFeeStroops).toBe(43500);
    expect(batch.totalFeeXlm).toBe('0.0043500');
  });

  it('generates formatted markdown benchmark report containing table columns', () => {
    const md = generateBenchmarkMarkdownReport();
    expect(md).toContain('# Stellar Payment Hub - Performance & Gas Benchmarks');
    expect(md).toContain('| Contract Method | CPU Instructions |');
    expect(md).toContain('execute_settlement_100_recipients');
  });
});
