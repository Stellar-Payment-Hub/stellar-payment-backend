import { Router, Request, Response } from 'express';

export interface OffChainDisputeRecord {
  id: string;
  settlementId?: string;
  paymentId?: string;
  initiator: string;
  reason: string;
  evidenceHash: string;
  status: 'PENDING' | 'RESOLVED_REFUND' | 'RESOLVED_RELEASE';
  createdAt: string;
  resolvedAt?: string;
}

const disputesStore: Map<string, OffChainDisputeRecord> = new Map([
  [
    'DISP-001',
    {
      id: 'DISP-001',
      paymentId: 'PAY-101',
      initiator: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      reason: 'Delayed milestone confirmation',
      evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    },
  ],
]);

export const disputesRouter = Router();

disputesRouter.get('/api/disputes', (_req: Request, res: Response) => {
  return res.json(Array.from(disputesStore.values()));
});

disputesRouter.post('/api/disputes', (req: Request, res: Response) => {
  const { paymentId, settlementId, initiator, reason, evidenceHash } = req.body;
  if (!initiator || !reason) {
    return res.status(400).json({ error: 'initiator and reason are required' });
  }

  const id = `DISP-${(disputesStore.size + 1).toString().padStart(3, '0')}`;
  const dispute: OffChainDisputeRecord = {
    id,
    paymentId,
    settlementId,
    initiator,
    reason,
    evidenceHash: evidenceHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  disputesStore.set(id, dispute);
  return res.status(201).json(dispute);
});
