import { Router, Request, Response } from 'express';
import { webhookService } from '../services/webhook-service';

export const webhooksRouter = Router();

function isSafeWebhookUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    // In production, block loopback, link-local, and private IP ranges (SSRF defense)
    const isPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('169.254.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isPrivate && process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Register new webhook (secret is only returned once upon creation)
webhooksRouter.post('/api/webhooks', (req: Request, res: Response) => {
  const { url, events } = req.body;
  if (!url || typeof url !== 'string' || !isSafeWebhookUrl(url)) {
    return res.status(400).json({ error: 'Valid, publicly reachable URL is required' });
  }
  const eventList = Array.isArray(events) && events.length > 0 ? events : ['*'];
  const sub = webhookService.register(url, eventList);
  return res.status(201).json(sub);
});

// List active webhooks (secrets redacted for security)
webhooksRouter.get('/api/webhooks', (_req: Request, res: Response) => {
  const subs = webhookService.list().map(({ secret, ...rest }) => ({
    ...rest,
    secret_masked: 'whsec_************************',
  }));
  return res.json(subs);
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

