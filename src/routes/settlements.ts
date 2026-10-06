import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';
import { paymentStream } from '../realtime/payment-stream';
import { SettlementStatus } from '../database/schema';

export const settlementsRouter = Router();

// GET /api/settlements - List settlements
settlementsRouter.get('/api/settlements', (req: Request, res: Response) => {
  const { payer, status } = req.query;

  const settlements = paymentRepository.listSettlements({
    payer: typeof payer === 'string' ? payer : undefined,
    status: status ? (status as SettlementStatus) : undefined,
  });

  res.status(200).json({
    status: 'ok',
    count: settlements.length,
    settlements,
  });
});

// GET /api/settlements/:id - Get settlement details
settlementsRouter.get('/api/settlements/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const settlement = paymentRepository.findSettlementById(id);

  if (!settlement) {
    res.status(404).json({
      status: 'error',
      message: `Settlement '${id}' not found.`,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    settlement,
  });
});

// POST /api/settlements - Create a new multi-address settlement request
settlementsRouter.post('/api/settlements', (req: Request, res: Response) => {
  const { payer, total_amount, memo, recipients, transaction_hash, ledger } = req.body;

  if (!payer || !total_amount || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
    res.status(400).json({
      status: 'error',
      message: 'payer, total_amount, and recipients array are required.',
    });
    return;
  }

  // Validate shares sum
  let sum = 0;
  for (const r of recipients) {
    if (!r.recipient || !r.amount || parseFloat(r.amount) <= 0) {
      res.status(400).json({
        status: 'error',
        message: 'Each recipient must have a valid address and positive amount.',
      });
      return;
    }
    sum += parseFloat(r.amount);
  }

  if (Math.abs(sum - parseFloat(total_amount)) > 0.0001) {
    res.status(400).json({
      status: 'error',
      message: `Sum of recipient amounts (${sum.toFixed(4)}) must equal total_amount (${total_amount}).`,
    });
    return;
  }

  const settlement = paymentRepository.createSettlement({
    payer,
    total_amount,
    memo: memo || '',
    recipients,
    transaction_hash,
    ledger,
  });

  paymentStream.broadcast('settlement:created', settlement);

  res.status(201).json({
    status: 'ok',
    settlement,
  });
});

// POST /api/settlements/:id/execute - Mark settlement executed/completed
settlementsRouter.post('/api/settlements/:id/execute', (req: Request, res: Response) => {
  const id = req.params.id;
  const { sub_payment_ids } = req.body;

  const settlement = paymentRepository.executeSettlement(id, sub_payment_ids || []);

  if (!settlement) {
    res.status(404).json({
      status: 'error',
      message: `Settlement '${id}' not found.`,
    });
    return;
  }

  paymentStream.broadcast('settlement:completed', settlement);

  res.status(200).json({
    status: 'ok',
    settlement,
  });
});

// POST /api/settlements/:id/cancel - Cancel settlement
settlementsRouter.post('/api/settlements/:id/cancel', (req: Request, res: Response) => {
  const id = req.params.id;
  const settlement = paymentRepository.cancelSettlement(id);

  if (!settlement) {
    res.status(404).json({
      status: 'error',
      message: `Settlement '${id}' not found.`,
    });
    return;
  }

  paymentStream.broadcast('settlement:cancelled', settlement);

  res.status(200).json({
    status: 'ok',
    settlement,
  });
});
