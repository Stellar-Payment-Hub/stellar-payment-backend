import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';
import { paymentStream } from '../realtime/payment-stream';

export const paymentRequestsRouter = Router();

// POST /api/payment-requests - Create a shareable payment request
paymentRequestsRouter.post('/api/payment-requests', (req: Request, res: Response) => {
  const { requester, amount, memo, expiresInHours } = req.body;

  if (!requester || !amount || parseFloat(amount) <= 0) {
    res.status(400).json({
      status: 'error',
      message: 'requester and positive amount are required.',
    });
    return;
  }

  const request = paymentRepository.createPaymentRequest({
    requester,
    amount,
    memo: memo || '',
    expiresInHours: expiresInHours ? parseInt(expiresInHours, 10) : 48,
  });

  paymentStream.broadcast('request:created', request);

  res.status(201).json({
    status: 'ok',
    request,
    shareUrl: `/request/${request.id}`,
  });
});

// GET /api/payment-requests/:id - Retrieve payment request details
paymentRequestsRouter.get('/api/payment-requests/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const request = paymentRepository.findPaymentRequestById(id);

  if (!request) {
    res.status(404).json({
      status: 'error',
      message: `Payment request '${id}' not found.`,
    });
    return;
  }

  res.status(200).json({
    status: 'ok',
    request,
  });
});

// PATCH /api/payment-requests/:id/pay - Mark request as fulfilled/paid
paymentRequestsRouter.patch('/api/payment-requests/:id/pay', (req: Request, res: Response) => {
  const id = req.params.id;
  const { paid_by, transaction_hash } = req.body;

  if (!paid_by || !transaction_hash) {
    res.status(400).json({
      status: 'error',
      message: 'paid_by address and transaction_hash are required.',
    });
    return;
  }

  const updated = paymentRepository.markPaymentRequestPaid(id, paid_by, transaction_hash);

  if (!updated) {
    res.status(404).json({
      status: 'error',
      message: `Payment request '${id}' not found.`,
    });
    return;
  }

  paymentStream.broadcast('request:paid', updated);

  res.status(200).json({
    status: 'ok',
    request: updated,
  });
});
