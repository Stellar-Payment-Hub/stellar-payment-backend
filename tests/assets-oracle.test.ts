import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { oracleService } from '../src/services/oracle-service';

describe('Assets & Oracle Services', () => {
  it('GET /api/assets returns token catalog with XLM, USDC, and EURC', async () => {
    const res = await request(app).get('/api/assets');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.assets.some((a: any) => a.code === 'XLM')).toBe(true);
    expect(res.body.assets.some((a: any) => a.code === 'USDC')).toBe(true);
  });

  it('OracleService converts values accurately between assets', () => {
    // 100 XLM @ $0.125 = $12.50 USD => 12.50 USDC
    const converted = oracleService.convert(100, 'XLM', 'USDC');
    expect(converted).toBeCloseTo(12.5, 2);
  });
});
