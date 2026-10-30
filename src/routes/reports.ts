import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';
import { createHash } from 'crypto';

export const reportsRouter = Router();

reportsRouter.get('/api/reports/payments.csv', (_req: Request, res: Response) => {
  const payments = paymentRepository.list();

  const headers = ['ID', 'Status', 'Creator', 'Recipient', 'Amount (XLM)', 'Memo', 'Contract Address', 'Created At'];
  const rows = payments.map((p) => [
    p.id,
    p.status,
    p.creator_address,
    p.recipient_address,
    p.amount,
    `"${p.memo.replace(/"/g, '""')}"`,
    p.contract_address,
    p.created_at,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="stellar-payments.csv"');
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
