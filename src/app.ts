import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health';
import { paymentsRouter } from './routes/payments';
import { errorHandler } from './middleware/error';

export const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRouter);
app.use('/', paymentsRouter);

// Global Error Handler
app.use(errorHandler);
