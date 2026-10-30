/**
 * High-Throughput Payment Traffic Simulator
 * Simulates concurrent merchant payment bursts and measures transaction throughput (TPS).
 */

export interface TrafficConfig {
  concurrency: number;
  totalTransactions: number;
  burstIntervalMs: number;
  asset: string;
}

export interface SimulationResult {
  totalSent: number;
  successful: number;
  failed: number;
  durationMs: number;
  tps: number;
  latencies: {
    minMs: number;
    maxMs: number;
    avgMs: number;
  };
}

export function buildSyntheticPaymentPayload(index: number, asset: string = 'USDC') {
  return {
    source: `GDEMO${index.toString().padStart(51, '0')}`,
    destination: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`,
    amount: (Math.round((10 + Math.random() * 90) * 100) / 100).toFixed(2),
    asset,
    memo: `SIM-TX-${index}-${Date.now()}`,
  };
}

export async function simulateTraffic(
  config: TrafficConfig,
  mockExecutor?: (payload: any) => Promise<boolean>
): Promise<SimulationResult> {
  const startTime = Date.now();
  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const executor = mockExecutor || (async () => {
    // Simulated network delay 10-30ms
    await new Promise(r => setTimeout(r, 10 + Math.random() * 20));
    return true;
  });

  const batches = Math.ceil(config.totalTransactions / config.concurrency);
  let txCount = 0;

  for (let b = 0; b < batches; b++) {
    const currentBatchSize = Math.min(config.concurrency, config.totalTransactions - txCount);
    const promises = Array.from({ length: currentBatchSize }).map(async (_, idx) => {
      const payload = buildSyntheticPaymentPayload(txCount + idx, config.asset);
      const reqStart = Date.now();
      try {
        const ok = await executor(payload);
        const reqLatency = Date.now() - reqStart;
        latencies.push(reqLatency);
        if (ok) successful++;
        else failed++;
      } catch {
        failed++;
      }
    });

    await Promise.all(promises);
    txCount += currentBatchSize;

    if (config.burstIntervalMs > 0 && b < batches - 1) {
      await new Promise(r => setTimeout(r, config.burstIntervalMs));
    }
  }

  const durationMs = Math.max(1, Date.now() - startTime);
  const totalSent = successful + failed;
  const tps = Math.round((totalSent / (durationMs / 1000)) * 100) / 100;
  const avgMs = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  return {
    totalSent,
    successful,
    failed,
    durationMs,
    tps,
    latencies: {
      minMs: latencies.length > 0 ? Math.min(...latencies) : 0,
      maxMs: latencies.length > 0 ? Math.max(...latencies) : 0,
      avgMs: Math.round(avgMs * 100) / 100,
    },
  };
}
