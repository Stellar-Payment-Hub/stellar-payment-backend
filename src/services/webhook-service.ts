import { createHmac, randomBytes } from 'crypto';

export interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface WebhookDeliveryAttempt {
  id: string;
  webhookId: string;
  event: string;
  statusCode?: number;
  success: boolean;
  attempt: number;
  timestamp: string;
}

export class WebhookService {
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveryHistory: WebhookDeliveryAttempt[] = [];
  private counter = 0;

  public register(url: string, events: string[]): WebhookSubscription {
    this.counter++;
    const id = `WH-${this.counter.toString().padStart(4, '0')}`;
    const secret = `whsec_${randomBytes(24).toString('hex')}`;
    const sub: WebhookSubscription = {
      id,
      url,
      secret,
      events,
      active: true,
      createdAt: new Date().toISOString(),
    };
    this.subscriptions.set(id, sub);
    return sub;
  }

  public list(): WebhookSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  public get(id: string): WebhookSubscription | undefined {
    return this.subscriptions.get(id);
  }

  public delete(id: string): boolean {
    return this.subscriptions.delete(id);
  }

  public signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  public recordDelivery(attempt: WebhookDeliveryAttempt): void {
    this.deliveryHistory.push(attempt);
    if (this.deliveryHistory.length > 500) {
      this.deliveryHistory.shift();
    }
  }

  public getDeliveryHistory(): WebhookDeliveryAttempt[] {
    return [...this.deliveryHistory];
  }
}

export const webhookService = new WebhookService();
