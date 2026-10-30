import { Router, Request, Response } from 'express';
import { paymentRepository } from '../database/repository';

export const metricsRouter = Router();

let totalHttpRequests = 0;

metricsRouter.use((_req, _res, next) => {
  totalHttpRequests++;
  next();
});

metricsRouter.get('/metrics', (_req: Request, res: Response) => {
  const paymentCount = paymentRepository.list().length;
  const settlementCount = paymentRepository.listSettlements().length;
  const mem = process.memoryUsage();

  const metrics = [
    '# HELP http_requests_total Total number of HTTP requests processed.',
    '# TYPE http_requests_total counter',
    `http_requests_total ${totalHttpRequests}`,
    '',
    '# HELP payments_registered_total Total count of payments in database.',
    '# TYPE payments_registered_total gauge',
    `payments_registered_total ${paymentCount}`,
    '',
    '# HELP settlements_registered_total Total count of multi-recipient settlements.',
    '# TYPE settlements_registered_total gauge',
    `settlements_registered_total ${settlementCount}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '',
    '# HELP process_heap_used_bytes Heap used size in bytes.',
    '# TYPE process_heap_used_bytes gauge',
    `process_heap_used_bytes ${mem.heapUsed}`,
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  return res.send(metrics);
});
