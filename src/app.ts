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
import { correlationMiddleware } from './middleware/correlation';
import { stellarRouter } from './routes/stellar';
import { assetsRouter } from './routes/assets';
import { webhooksRouter } from './routes/webhooks';
import { reportsRouter } from './routes/reports';
import { analyticsRouter } from './routes/analytics';
import { disputesRouter } from './routes/disputes';
import { metricsRouter } from './routes/metrics';
import { docsRouter } from './routes/docs';

export const app = express();

app.use(correlationMiddleware);
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

// Core Routes
app.use('/', healthRouter);
app.use('/', paymentsRouter);

// Settlement, Invoice & Transaction Routes
app.use('/', settlementsRouter);
app.use('/', paymentRequestsRouter);
app.use('/', transactionsRouter);
app.use('/', stellarRouter);
app.use('/', assetsRouter);
app.use('/', webhooksRouter);
app.use('/', reportsRouter);
app.use('/', analyticsRouter);
app.use('/', disputesRouter);
app.use('/', metricsRouter);
app.use('/', docsRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
