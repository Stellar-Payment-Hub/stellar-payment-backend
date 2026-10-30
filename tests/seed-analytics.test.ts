import { describe, it, expect } from 'vitest';
import { seedDemoAnalyticsData } from '../scripts/seed-analytics';

describe('Analytics Seed Data Populator', () => {
  it('seeds specified record count with cumulative volume metrics', () => {
    const res = seedDemoAnalyticsData(20);
    expect(res.seededRecords).toBe(20);
    expect(res.cumulativeVolumeUsdc).toBeGreaterThan(0);
    expect(res.sampleRecord.asset).toBe('USDC');
    expect(res.sampleRecord.status).toBe('COMPLETED');
  });
});
