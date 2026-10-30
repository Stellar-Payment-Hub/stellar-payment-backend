import crypto from 'crypto';

export interface TraceContext {
  traceId: string;
  spanId: string;
  sampled: boolean;
}

export function generateTraceparent(): string {
  const traceId = crypto.randomBytes(16).toString('hex');
  const spanId = crypto.randomBytes(8).toString('hex');
  return `00-${traceId}-${spanId}-01`;
}

export function parseTraceparent(header?: string | null): TraceContext | null {
  if (!header || typeof header !== 'string') return null;
  const parts = header.trim().split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, spanId, flags] = parts;
  if (version !== '00' || traceId.length !== 32 || spanId.length !== 16) {
    return null;
  }

  return {
    traceId,
    spanId,
    sampled: flags === '01',
  };
}
