import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

const ADMIN_SECRET_TOKEN = process.env.ADMIN_API_TOKEN || 'sph_admin_secret_testnet_token';

/**
 * Perform a constant-time string comparison to prevent timing attack vulnerabilities.
 */
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!safeCompare(token, ADMIN_SECRET_TOKEN)) {
    res.status(403).json({ error: 'Forbidden: Insufficient administrative privileges' });
    return;
  }

  next();
}

