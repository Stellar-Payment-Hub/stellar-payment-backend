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
