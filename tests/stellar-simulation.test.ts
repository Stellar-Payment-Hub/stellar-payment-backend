import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Stellar Simulation API', () => {
  it('rejects simulation without transactionXdr', async () => {
    const res = await request(app).post('/api/stellar/simulate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('transactionXdr');
  });

  it('simulates Soroban transaction with resource footprints', async () => {
    const res = await request(app)
      .post('/api/stellar/simulate')
      .send({ transactionXdr: 'AAAAAgAAAAB' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBeDefined();
  });
});
