import { createHash } from 'crypto';

export interface VerifiableInvoice {
  id: string;
  requester: string;
  amount: string;
  asset: string;
  memo: string;
  expiresAt: string;
  checksum: string;
}

export function generateInvoiceChecksum(invoice: Omit<VerifiableInvoice, 'checksum'>): string {
  const content = `${invoice.id}:${invoice.requester}:${invoice.amount}:${invoice.asset}:${invoice.memo}:${invoice.expiresAt}`;
  return createHash('sha256').update(content).digest('hex');
}

export function verifyInvoiceChecksum(invoice: VerifiableInvoice): boolean {
  const expected = generateInvoiceChecksum(invoice);
  return expected === invoice.checksum;
}
