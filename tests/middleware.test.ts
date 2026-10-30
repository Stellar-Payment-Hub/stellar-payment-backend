import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Middleware Integration', () => {
  it('attaches RateLimit headers to all responses', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
    expect(res.headers['ratelimit-reset']).toBeDefined();
  });

  it('propagates or assigns X-Correlation-ID header', async () => {
    const testId = 'corr-test-12345';
    const res = await request(app).get('/health').set('X-Correlation-ID', testId);
    expect(res.headers['x-correlation-id']).toBe(testId);
  });
});
