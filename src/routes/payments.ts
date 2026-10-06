import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';
import { paymentStream } from '../realtime/payment-stream';
import { processContractEvent, IngestEventInput } from '../events/processor';
import { PaymentStatus } from '../database/schema';

export const paymentsRouter = Router();

// GET /api/payments - List payments with optional filters
paymentsRouter.get('/api/payments', (req: Request, res: Response) => {
  const { status, creator, recipient } = req.query;

  const payments = paymentRepository.list({
    status: status ? (status as PaymentStatus) : undefined,
    creator: typeof creator === 'string' ? creator : undefined,
    recipient: typeof recipient === 'string' ? recipient : undefined,
  });

  res.status(200).json({
    status: 'ok',
    count: payments.length,
    payments,
  });
});

// GET /api/payments/:id - Get single payment detail
paymentsRouter.get('/api/payments/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const payment = paymentRepository.findById(id);

  if (!payment) {
    res.status(404).json({
      status: 'error',
      message: `Payment with ID '${id}' not found.`,
    });
    return;
  }

  const events = paymentRepository.listEvents(id);

  res.status(200).json({
    status: 'ok',
    payment,
    events,
  });
});

// POST /api/payments - Register/Index a payment from Soroban contract or frontend
paymentsRouter.post('/api/payments', (req: Request, res: Response) => {
  const {
    creator_address,
    recipient_address,
    amount,
    memo,
    contract_address,
    transaction_hash,
    ledger,
    on_chain_id,
  } = req.body;

  if (!creator_address || !recipient_address || !amount) {
    res.status(400).json({
      status: 'error',
      message: 'creator_address, recipient_address, and amount are required.',
    });
    return;
  }

  const payment = paymentRepository.create({
    creator_address,
    recipient_address,
    amount,
    memo: memo || '',
    status: 'PENDING',
    contract_address:
      contract_address || 'CCBUEU4J4YXGSWURDMKUONPNGQ4ETBACWO5PC7IL5H4DVNYWJLYFETGY',
    transaction_hash,
    ledger,
    on_chain_id,
  });

  // Broadcast creation to SSE subscribers
  paymentStream.broadcast('payment:created', payment);

  res.status(201).json({
    status: 'ok',
    payment,
  });
});

// PATCH /api/payments/:id/status - Update payment status
paymentsRouter.patch('/api/payments/:id/status', (req: Request, res: Response) => {
  const id = req.params.id;
  const { status } = req.body;

  const validStatuses: PaymentStatus[] = [
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'EXPIRED',
  ];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      status: 'error',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
    return;
  }

  const updated = paymentRepository.updateStatus(id, status);

  if (!updated) {
    res.status(404).json({
      status: 'error',
      message: `Payment '${id}' not found.`,
    });
    return;
  }

  paymentStream.broadcast('payment:updated', { payment: updated, status });

  res.status(200).json({
    status: 'ok',
    payment: updated,
  });
});

// GET /api/payments/:id/events - Retrieve event audit log for payment
paymentsRouter.get('/api/payments/:id/events', (req: Request, res: Response) => {
  const id = req.params.id;
  const events = paymentRepository.listEvents(id);

  res.status(200).json({
    status: 'ok',
    payment_id: id,
    events,
  });
});

// POST /api/events/process - Ingest contract event with idempotency
paymentsRouter.post('/api/events/process', (req: Request, res: Response) => {
  const input: IngestEventInput = req.body;

  if (!input.event_type || !input.transaction_hash) {
    res.status(400).json({
      status: 'error',
      message: 'event_type and transaction_hash are required.',
    });
    return;
  }

  const result = processContractEvent(input);

  if (result.duplicate) {
    res.status(200).json({
      status: 'skipped',
      message: 'Event was already processed (idempotent duplicate skipped).',
    });
    return;
  }

  if (!result.processed) {
    res.status(404).json({
      status: 'error',
      message: 'Matching payment not found for event ingestion.',
    });
    return;
  }

  res.status(200).json({
    status: 'processed',
    payment_id: result.paymentId,
  });
});

// GET /api/payments/stream - Server-Sent Events (SSE) real-time stream
paymentsRouter.get('/api/payments/stream', (req: Request, res: Response) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  paymentStream.addClient(clientId, res);

  req.on('close', () => {
    paymentStream.removeClient(clientId);
  });
});
