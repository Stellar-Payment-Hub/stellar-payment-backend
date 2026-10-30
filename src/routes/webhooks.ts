import { Router, Request, Response } from 'express';
import { webhookService } from '../services/webhook-service';

export const webhooksRouter = Router();

// Register new webhook
webhooksRouter.post('/api/webhooks', (req: Request, res: Response) => {
  const { url, events } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url string is required' });
  }
  const eventList = Array.isArray(events) && events.length > 0 ? events : ['*'];
  const sub = webhookService.register(url, eventList);
  return res.status(201).json(sub);
});

// List active webhooks
webhooksRouter.get('/api/webhooks', (_req: Request, res: Response) => {
  return res.json(webhookService.list());
});

// Delete webhook
webhooksRouter.delete('/api/webhooks/:id', (req: Request, res: Response) => {
  const success = webhookService.delete(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Webhook subscription not found' });
  }
  return res.json({ status: 'deleted', id: req.params.id });
});

// View delivery history
webhooksRouter.get('/api/webhooks/deliveries', (_req: Request, res: Response) => {
  return res.json(webhookService.getDeliveryHistory());
});
