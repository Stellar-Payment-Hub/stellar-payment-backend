import { Router, Request, Response } from 'express';
import { verifyAdminAuth } from '../middleware/auth';

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

// Resolve dispute (Arbitrator / Admin action)
disputesRouter.patch('/api/disputes/:id/resolve', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !verifyAdminAuth(req)) {
    return res.status(401).json({
      error: 'Unauthorized: Administrative or arbitrator credentials required in production',
    });
  }

  const { resolution } = req.body;
  const dispute = disputesStore.get(req.params.id);

  if (!dispute) {
    return res.status(404).json({ error: `Dispute '${req.params.id}' not found` });
  }

  const validResolutions = ['RESOLVED_REFUND', 'RESOLVED_RELEASE'];
  if (!resolution || !validResolutions.includes(resolution)) {
    return res.status(400).json({
      error: `Invalid resolution. Must be one of: ${validResolutions.join(', ')}`,
    });
  }

  dispute.status = resolution as any;
  dispute.resolvedAt = new Date().toISOString();
  disputesStore.set(req.params.id, dispute);

  return res.json({ status: 'ok', dispute });
});

