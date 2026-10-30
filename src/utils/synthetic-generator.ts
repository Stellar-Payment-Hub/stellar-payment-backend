/**
 * Synthetic Transaction Batch Generator
 * Generates realistic payroll and merchant payment datasets for analytics and demos.
 */

export interface SyntheticBatchConfig {
  merchantAddress: string;
  recipientPrefix?: string;
  batchSize: number;
  asset: string;
  minAmount: number;
  maxAmount: number;
}

export function generateSyntheticBatch(config: SyntheticBatchConfig) {
  const items = [];
  let totalVolume = 0;

  for (let i = 0; i < config.batchSize; i++) {
    const amountNum = Math.round((config.minAmount + Math.random() * (config.maxAmount - config.minAmount)) * 100) / 100;
    totalVolume += amountNum;

    const hex = i.toString(16).padStart(4, '0').toUpperCase();
    items.push({
      id: `PAY-SYNTH-${i.toString().padStart(4, '0')}`,
      source: config.merchantAddress,
      destination: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLL${hex}`,
      amount: amountNum.toFixed(2),
      asset: config.asset,
      status: 'COMPLETED',
      timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
      transactionHash: `tx_hash_${i}_${Date.now()}`,
    });
  }

  return {
    totalCount: items.length,
    totalVolume: Math.round(totalVolume * 100) / 100,
    items,
  };
}
