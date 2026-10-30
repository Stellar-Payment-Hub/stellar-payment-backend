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
      // Record simulated delivery attempt
      webhookService.recordDelivery({
        id: `DEL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        webhookId: sub.id,
        event: eventType,
        statusCode: 200,
        success: true,
        attempt: 1,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
