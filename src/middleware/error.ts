import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const correlationId = (req as any).correlationId || req.headers['x-correlation-id'] || 'none';

  console.error(`[Error Middleware]: ${err.message}`);

  // RFC 7807 Problem Details
  res.status(statusCode).json({
    type: 'https://stellar-payment-hub/errors/' + statusCode,
    title: err.name || 'Internal Server Error',
    status: statusCode,
    detail: err.message,
    instance: req.originalUrl,
    correlationId,
    timestamp: new Date().toISOString(),
  });
}
