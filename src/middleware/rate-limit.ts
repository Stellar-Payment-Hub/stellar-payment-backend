import { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 60; // 60 requests per minute

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  const record = requestCounts.get(ip);
  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests. Please slow down and try again in 1 minute.',
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    });
    return;
  }

  next();
}
