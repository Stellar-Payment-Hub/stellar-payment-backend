import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';
import { paymentStream } from '../realtime/payment-stream';
import { processContractEvent, IngestEventInput } from '../events/processor';
import { PaymentStatus } from '../database/schema';
import { verifyAdminAuth } from '../middleware/auth';
import {
  generatePaymentReceipt,
  verifyPaymentReceipt,
  getReceiptSigningKeypair,
  PaymentNotFinalizedError,
  ReceiptMasterKeyMissingError,
  SignedPaymentReceipt,
} from '../services/receipt-service';

export const paymentsRouter = Router();

// GET /api/payments/receipt-public-key - Retrieve Payment Hub Ed25519 master public key
paymentsRouter.get('/api/payments/receipt-public-key', (_req: Request, res: Response) => {
  try {
    const keypair = getReceiptSigningKeypair();
    res.status(200).json({
      status: 'ok',
      algorithm: 'Ed25519',
      signer_public_key: keypair.publicKey(),
    });
  } catch (err) {
    if (err instanceof ReceiptMasterKeyMissingError) {
      res.status(503).json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    throw err;
  }
});

// GET /api/payments - List payments with optional filters
paymentsRouter.get('/api/payments/search', (req: Request, res: Response) => {
  const { q, status, creator, recipient, limit, offset, sortBy, sortOrder } = req.query;
  const result = (paymentRepository as any).queryPayments({
    search: typeof q === 'string' ? q : undefined,
    status: typeof status === 'string' ? status : undefined,
    creator: typeof creator === 'string' ? creator : undefined,
    recipient: typeof recipient === 'string' ? recipient : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
    sortBy: sortBy as any,
    sortOrder: sortOrder as any,
  });
  return res.json(result);
});

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

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({
      status: 'error',
      message: 'amount must be a valid positive number.',
    });
    return;
  }

  // Basic Stellar address format check (standard 56-character Ed25519 public key)
  if (
    typeof creator_address !== 'string' ||
    typeof recipient_address !== 'string' ||
    creator_address.length < 50 ||
    recipient_address.length < 50
  ) {
    res.status(400).json({
      status: 'error',
      message: 'creator_address and recipient_address must be valid Stellar public keys.',
    });
    return;
  }

  const payment = paymentRepository.create({
    creator_address,
    recipient_address,
    amount: parsedAmount.toFixed(7),
    memo: typeof memo === 'string' ? memo.substring(0, 256) : '',
    status: 'PENDING',
    contract_address:
      contract_address || 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
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

// PATCH /api/payments/:id/status - Update payment status with transition validation
paymentsRouter.patch('/api/payments/:id/status', (req: Request, res: Response) => {
  const id = req.params.id;
  const { status } = req.body;

  // In production, require administrative or webhook bearer token to mutate payment states
  if (process.env.NODE_ENV === 'production' && !verifyAdminAuth(req)) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Authentication required to mutate payment lifecycle status.',
    });
    return;
  }

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

// GET /api/payments/:id/receipt - Issue Ed25519 cryptographically signed proof-of-payment receipt
paymentsRouter.get('/api/payments/:id/receipt', (req: Request, res: Response) => {
  const id = req.params.id;
  const payment = paymentRepository.findById(id);

  if (!payment) {
    res.status(404).json({
      status: 'error',
      message: `Payment with ID '${id}' not found.`,
    });
    return;
  }

  try {
    const receipt = generatePaymentReceipt(payment);
    res.status(200).json({
      status: 'ok',
      receipt,
    });
  } catch (err) {
    if (err instanceof PaymentNotFinalizedError) {
      res.status(409).json({
        status: 'error',
        message: err.message,
        payment_status: err.currentStatus,
      });
      return;
    }
    if (err instanceof ReceiptMasterKeyMissingError) {
      res.status(503).json({
        status: 'error',
        message: err.message,
      });
      return;
    }
    throw err;
  }
});

// POST /api/payments/:id/verify-receipt - Validate Ed25519 signed proof-of-payment receipt
paymentsRouter.post('/api/payments/:id/verify-receipt', (req: Request, res: Response) => {
  const id = req.params.id;
  const body = req.body as Record<string, unknown> | undefined;

  if (!body || typeof body !== 'object') {
    res.status(400).json({
      status: 'error',
      valid: false,
      message: 'Request body must contain a signed payment receipt.',
    });
    return;
  }

  const candidateReceipt = (
    body.receipt && typeof body.receipt === 'object' ? body.receipt : body
  ) as Partial<SignedPaymentReceipt>;

  if (!candidateReceipt.payload || !candidateReceipt.signature) {
    res.status(400).json({
      status: 'error',
      valid: false,
      message: 'Both receipt payload and Ed25519 signature are required.',
    });
    return;
  }

  let masterPublicKey: string;
  try {
    masterPublicKey = getReceiptSigningKeypair().publicKey();
  } catch (err) {
    if (err instanceof ReceiptMasterKeyMissingError) {
      res.status(503).json({
        status: 'error',
        valid: false,
        message: err.message,
      });
      return;
    }
    throw err;
  }

  const indexedPayment = paymentRepository.findById(id);
  const result = verifyPaymentReceipt(candidateReceipt, {
    expectedPaymentId: id,
    expectedSignerPublicKey: masterPublicKey,
    indexedPayment,
  });

  res.status(200).json({
    status: 'ok',
    ...result,
  });
});

// POST /api/events/process - Ingest contract event with idempotency
paymentsRouter.post('/api/events/process', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !verifyAdminAuth(req)) {
    res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Authentication required to ingest contract events.',
    });
    return;
  }

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
  const accountFilter = req.query.account as string | undefined;
  const lastEventId = (req.headers['last-event-id'] || req.query.lastEventId) as string | undefined;
  paymentStream.addClient(clientId, res, accountFilter, lastEventId);

  req.on('close', () => {
    paymentStream.removeClient(clientId);
  });
});
