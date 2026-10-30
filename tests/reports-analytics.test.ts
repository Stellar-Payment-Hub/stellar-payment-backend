import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Reports & Analytics API', () => {
  it('GET /api/reports/payments.csv returns CSV formatted data', async () => {
    const res = await request(app).get('/api/reports/payments.csv');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('ID,Status,Creator');
  });

  it('GET /api/reports/transactions.json returns JSON with SHA-256 checksum', async () => {
    const res = await request(app).get('/api/reports/transactions.json');
    expect(res.status).toBe(200);
    expect(res.body.checksum).toBeDefined();
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('GET /api/analytics/summary returns volume and count metrics', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(parseFloat(res.body.totalPaymentVolumeXlm)).toBeGreaterThan(0);
    expect(res.body.successRatePercentage).toBeDefined();
  });
});
