import { Router, Request, Response } from 'express';
import { env } from '../config/env';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'stellar-payment-backend',
    network: env.stellarNetwork,
  });
});

healthRouter.get('/api/health/ledger', async (_req, res) => {
  const { stellarClient } = await import('../services/stellar-client');
  const sequence = await stellarClient.getLatestLedger();
  return res.json({
    status: 'healthy',
    network: 'testnet',
    protocolVersion: 22,
    latestLedger: sequence,
    timestamp: new Date().toISOString(),
  });
});
