import { Request, Response, NextFunction } from 'express';

interface ClientBucket {
  count: number;
  resetTime: number;
}

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 200;
const clients = new Map<string, ClientBucket>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let bucket = clients.get(ip);
  if (!bucket || bucket.resetTime <= now) {
    bucket = { count: 0, resetTime: now + windowMs };
    clients.set(ip, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, maxRequests - bucket.count);
  const resetSeconds = Math.ceil((bucket.resetTime - now) / 1000);

  // RFC 6585 standard headers
  res.setHeader('RateLimit-Limit', maxRequests);
  res.setHeader('RateLimit-Remaining', remaining);
  res.setHeader('RateLimit-Reset', resetSeconds);

  if (bucket.count > maxRequests) {
    res.setHeader('Retry-After', resetSeconds);
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
    });
    return;
  }

  next();
}
