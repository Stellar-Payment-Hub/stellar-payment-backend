import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { paymentsRouter } from './routes/payments';
import { settlementsRouter } from './routes/settlements';
import { paymentRequestsRouter } from './routes/payment-requests';
import { transactionsRouter } from './routes/transactions';
import { rateLimiter } from './middleware/rate-limit';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Level 1 & 2 Routes
app.use('/', healthRouter);
app.use('/', paymentsRouter);

// Level 3 Advanced Routes
app.use('/', settlementsRouter);
app.use('/', paymentRequestsRouter);
app.use('/', transactionsRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
