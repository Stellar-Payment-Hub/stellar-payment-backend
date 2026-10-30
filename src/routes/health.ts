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

healthRouter.get('/api/health/diagnostics', async (_req, res) => {
  const { paymentRepository } = await import('../database/repository');
  const mem = process.memoryUsage();
  return res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: (mem.rss / 1024 / 1024).toFixed(2),
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
    },
    database: {
      paymentsCount: paymentRepository.list().length,
      settlementsCount: paymentRepository.listSettlements().length,
      transactionsCount: paymentRepository.listTransactions().length,
    },
    timestamp: new Date().toISOString(),
  });
});
