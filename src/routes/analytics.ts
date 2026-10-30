import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';

export const analyticsRouter = Router();

analyticsRouter.get('/api/analytics/summary', (_req: Request, res: Response) => {
  const payments = paymentRepository.list();
  const settlements = paymentRepository.listSettlements();
  const txs = paymentRepository.listTransactions();

  const totalPaymentVolume = payments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);
  const totalSettlementVolume = settlements.reduce((acc, s) => acc + parseFloat(s.total_amount || '0'), 0);

  const completedPayments = payments.filter((p) => p.status === 'COMPLETED').length;
  const pendingPayments = payments.filter((p) => p.status === 'PENDING').length;

  return res.json({
    totalPaymentsCount: payments.length,
    completedPaymentsCount: completedPayments,
    pendingPaymentsCount: pendingPayments,
    totalPaymentVolumeXlm: totalPaymentVolume.toFixed(7),
    totalSettlementsCount: settlements.length,
    totalSettlementVolumeXlm: totalSettlementVolume.toFixed(7),
    totalTransactionsLogged: txs.length,
    successRatePercentage: payments.length > 0 ? ((completedPayments / payments.length) * 100).toFixed(1) : '100.0',
    updatedAt: new Date().toISOString(),
  });
});
