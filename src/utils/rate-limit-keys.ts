import crypto from 'crypto';

export function createRateLimitKey(ip: string, authHeader?: string, path?: string): string {
  const base = ip || '127.0.0.1';
  if (!authHeader) {
    return `rl:ip:${base}:${path || 'global'}`;
  }

  const hash = crypto.createHash('sha256').update(authHeader).digest('hex').substring(0, 16);
  return `rl:auth:${hash}:${path || 'global'}`;
}
