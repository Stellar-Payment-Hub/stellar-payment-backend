import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Dispute Resolution Lifecycle API', () => {
  it('creates, lists, and validates dispute records through the API', async () => {
    // 1. Fetch initial disputes
    const listRes = await request(app).get('/api/disputes');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    // 2. Submit new dispute
    const newDispute = {
      paymentId: 'PAY-101',
      initiator: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      reason: 'Milestone 2 deliverable failed acceptance verification',
      evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };

    const createRes = await request(app).post('/api/disputes').send(newDispute);
    expect(createRes.status).toBe(201);
    expect(createRes.body.id).toBeDefined();
    expect(createRes.body.status).toBe('PENDING');
    expect(createRes.body.reason).toContain('acceptance verification');

    // 3. Rejects dispute without initiator or reason
    const badRes = await request(app).post('/api/disputes').send({});
    expect(badRes.status).toBe(400);
  });
});

