import { webhookService } from './webhook-service';

export async function dispatchWebhookEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
  const subscriptions = webhookService.list().filter((sub) => sub.active);
  const payloadString = JSON.stringify({
    event: eventType,
    data: payload,
    timestamp: new Date().toISOString(),
  });

  for (const sub of subscriptions) {
    if (sub.events.includes('*') || sub.events.includes(eventType)) {
      const signature = webhookService.signPayload(payloadString, sub.secret);
      const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch(sub.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-SPH-Signature': `sha256=${signature}`,
              'User-Agent': 'StellarPaymentHub-Webhook/1.0',
            },
            body: payloadString,
            signal: AbortSignal.timeout(4000),
          });

          webhookService.recordDelivery({
            id: deliveryId,
            webhookId: sub.id,
            event: eventType,
            statusCode: res.status,
            success: res.ok,
            attempt: 1,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        webhookService.recordDelivery({
          id: deliveryId,
          webhookId: sub.id,
          event: eventType,
          statusCode: 504,
          success: false,
          attempt: 1,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
}

