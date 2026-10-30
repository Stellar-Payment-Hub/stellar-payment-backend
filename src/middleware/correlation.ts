import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerId = req.headers['x-correlation-id'] as string;
  const correlationId = headerId || randomUUID();
  (req as any).correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
}
