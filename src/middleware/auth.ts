import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Retrieve configured administrative API secret.
 * Supports both ADMIN_API_TOKEN and ADMIN_API_KEY environment variables.
 * In production, strictly requires explicit configuration (fails closed; no testnet fallback).
 */
export function getAdminToken(): string | undefined {
  const token = process.env.ADMIN_API_TOKEN || process.env.ADMIN_API_KEY;
  if (token) {
    return token.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    return undefined; // Fail-closed in production
  }
  return 'sph_admin_secret_testnet_token';
}

/**
 * Perform a constant-time string comparison to prevent timing attack vulnerabilities (CWE-208).
 */
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Validates request administrative bearer authorization.
 * Returns true if authenticated or if running in non-production environment.
 */
export function verifyAdminAuth(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const expectedToken = getAdminToken();
  if (!expectedToken) {
    return false;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7).trim();
  return safeCompare(token, expectedToken);
}

/**
 * Express middleware requiring valid administrative authentication.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedToken = getAdminToken();
  if (!expectedToken) {
    res.status(500).json({ error: 'Server misconfiguration: Administrative token not set in production' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!safeCompare(token, expectedToken)) {
    res.status(403).json({ error: 'Forbidden: Insufficient administrative privileges' });
    return;
  }

  next();
}
