import { Router, Request, Response } from 'express';

export const docsRouter = Router();

const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Stellar Payment Hub API',
    version: '1.0.0',
    description: 'Decentralized multi-address payment routing and settlement API on Stellar & Soroban.',
  },
  paths: {
    '/health': {
      get: { summary: 'Health Check', responses: { '200': { description: 'Service operational' } } },
    },
    '/api/payments': {
      get: { summary: 'List Payments', responses: { '200': { description: 'List of payment records' } } },
      post: { summary: 'Create Payment', responses: { '201': { description: 'Created payment' } } },
    },
    '/api/settlements': {
      get: { summary: 'List Settlements', responses: { '200': { description: 'List of multi-address settlements' } } },
      post: { summary: 'Create Settlement', responses: { '201': { description: 'Created settlement' } } },
    },
    '/api/stellar/simulate': {
      post: { summary: 'Simulate Soroban Transaction', responses: { '200': { description: 'Simulation result' } } },
    },
    '/api/assets': {
      get: { summary: 'Supported Asset Catalog', responses: { '200': { description: 'Supported tokens' } } },
    },
  },
};

docsRouter.get('/api-docs.json', (_req: Request, res: Response) => {
  return res.json(openApiSpec);
});
