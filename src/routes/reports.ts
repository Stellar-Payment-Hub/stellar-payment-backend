import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';
import { createHash } from 'crypto';

export const reportsRouter = Router();

/**
 * Neutralize CSV Formula Injection (CWE-1236).
 * Any cell value starting with '=', '+', '-', '@', tab, or carriage return is escaped.
 */
function sanitizeCsvCell(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const triggerChars = ['=', '+', '-', '@', '\t', '\r'];
  const safeStr = triggerChars.includes(str.charAt(0)) ? `'${str}` : str;
  return `"${safeStr.replace(/"/g, '""')}"`;
}

reportsRouter.get('/api/reports/payments.csv', (_req: Request, res: Response) => {
  const payments = paymentRepository.list();

  const headers = ['ID', 'Status', 'Creator', 'Recipient', 'Amount (XLM)', 'Memo', 'Contract Address', 'Created At'];
  const rows = payments.map((p) => [
    sanitizeCsvCell(p.id),
    sanitizeCsvCell(p.status),
    sanitizeCsvCell(p.creator_address),
    sanitizeCsvCell(p.recipient_address),
    sanitizeCsvCell(p.amount),
    sanitizeCsvCell(p.memo),
    sanitizeCsvCell(p.contract_address),
    sanitizeCsvCell(p.created_at),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="stellar-payments.csv"');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.send(csvContent);
});

reportsRouter.get('/api/reports/transactions.json', (_req: Request, res: Response) => {
  const txs = paymentRepository.listTransactions();
  const jsonString = JSON.stringify(txs, null, 2);
  const checksum = createHash('sha256').update(jsonString).digest('hex');

  return res.json({
    data: txs,
    count: txs.length,
    checksum,
    exportedAt: new Date().toISOString(),
  });
});

