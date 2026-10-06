import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('GET /health', () => {
  it('should return 200 OK with service information and testnet network', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'stellar-payment-backend',
      network: 'testnet',
    });
  });
});
