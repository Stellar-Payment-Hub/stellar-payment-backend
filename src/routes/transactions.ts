import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';

export const transactionsRouter = Router();

// GET /api/transactions - List transactions
transactionsRouter.get('/api/transactions', (_req: Request, res: Response) => {
  const transactions = paymentRepository.listTransactions();

  res.status(200).json({
    status: 'ok',
    count: transactions.length,
    transactions,
  });
});

// GET /api/transactions/:hash - Get single transaction by hash
transactionsRouter.get('/api/transactions/:hash', (req: Request, res: Response) => {
  const hash = req.params.hash;
  const transaction = paymentRepository.findTransactionByHash(hash);

  if (!transaction) {
    res.status(404).json({
      status: 'error',
      message: `Transaction '${hash}' not found.`,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    transaction,
  });
});

// POST /api/transactions - Record a transaction
transactionsRouter.post('/api/transactions', (req: Request, res: Response) => {
  const { hash, source, destination, amount, asset, type, status, ledger } = req.body;

  if (!hash || !source || !destination || !amount) {
    res.status(400).json({
      status: 'error',
      message: 'hash, source, destination, and amount are required.',
    });
    return;
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({
      status: 'error',
      message: 'amount must be a positive number.',
    });
    return;
  }

  const tx = paymentRepository.addTransaction({
    hash,
    source,
    destination,
    amount,
    asset: asset || 'native',
    type: type || 'Native Payment',
    status: status || 'Success',
    ledger: ledger || 0,
  });

  res.status(201).json({
    status: 'ok',
    transaction: tx,
  });
});
