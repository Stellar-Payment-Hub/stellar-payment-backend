#!/usr/bin/env node
/**
 * Analytics Seed Data Populator
 * Generates synthetic merchant payments, splits, and dispute records for rich demos.
 */
import { generateSyntheticBatch } from '../src/utils/synthetic-generator';

export function seedDemoAnalyticsData(recordCount: number = 25) {
  const merchant = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const batch = generateSyntheticBatch({
    merchantAddress: merchant,
    batchSize: recordCount,
    asset: 'USDC',
    minAmount: 20,
    maxAmount: 250,
  });

  return {
    seededRecords: batch.totalCount,
    cumulativeVolumeUsdc: batch.totalVolume,
    sampleRecord: batch.items[0],
  };
}

if (process.argv[1]?.endsWith('seed-analytics.ts')) {
  console.log('Seeding demo analytics...');
  const res = seedDemoAnalyticsData(50);
  console.log('Seeded successfully:', res);
}
