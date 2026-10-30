/**
 * Official TypeScript SDK for Stellar Payment Hub
 * Provides typed REST client and SSE subscriber for merchant apps.
 */

export interface StellarHubClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface SplitRequest {
  payer: string;
  totalAmount: string;
  asset: string;
  recipients: Array<{ address: string; amount: string }>;
  memo?: string;
}

export class StellarPaymentHubClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: StellarHubClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`StellarHub API Error [${res.status}]: ${JSON.stringify(errBody)}`);
    }

    return res.json() as Promise<T>;
  }

  public async getHealth(): Promise<{ status: string; uptime: number }> {
    return this.request('/health');
  }

  public async getPayment(id: string): Promise<any> {
    return this.request(`/api/payments/${id}`);
  }

  public async calculateSplit(totalAmount: string, recipientCount: number): Promise<any> {
    return this.request('/api/settlements/calculate-split', {
      method: 'POST',
      body: JSON.stringify({ total_amount: totalAmount, recipients_count: recipientCount }),
    });
  }

  public async createSettlement(req: SplitRequest): Promise<any> {
    return this.request('/api/settlements', {
      method: 'POST',
      body: JSON.stringify({
        payer: req.payer,
        total_amount: req.totalAmount,
        asset: req.asset,
        recipients: req.recipients.map(r => ({ recipient: r.address, amount: r.amount })),
        memo: req.memo,
      }),
    });
  }
}
