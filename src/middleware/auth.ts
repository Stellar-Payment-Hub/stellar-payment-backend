import { Request, Response, NextFunction } from 'express';

const ADMIN_SECRET_TOKEN = process.env.ADMIN_API_TOKEN || 'sph_admin_secret_testnet_token';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
    return;
  }

  const token = authHeader.substring(7);
  if (token !== ADMIN_SECRET_TOKEN) {
    res.status(403).json({ error: 'Forbidden: Insufficient administrative privileges' });
    return;
  }

  next();
}
