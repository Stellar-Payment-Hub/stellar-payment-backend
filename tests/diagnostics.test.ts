import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Health Diagnostics API', () => {
  it('GET /api/health/diagnostics returns detailed system telemetry', async () => {
    const res = await request(app).get('/api/health/diagnostics');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.memory.rssMb).toBeDefined();
    expect(res.body.database.paymentsCount).toBeGreaterThan(0);
  });
});
