import { Payment, PaymentEvent, PaymentStatus } from './schema';

class PaymentRepository {
  private payments: Map<string, Payment> = new Map();
  private events: Map<string, PaymentEvent[]> = new Map();
  private processedEventHashes: Set<string> = new Set();
  private counter: number = 0;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed initial demo records for Level 2 verification
    const initialPayments: Omit<Payment, 'id' | 'on_chain_id' | 'created_at' | 'updated_at'>[] = [
      {
        creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '25.0000000',
        memo: 'Invoice #1042',
        status: 'PENDING',
        contract_address: 'CCBUEU4J4YXGSWURDMKUONPNGQ4ETBACWO5PC7IL5H4DVNYWJLYFETGY',
        transaction_hash: '3389e9f2f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889',
        ledger: 104250,
      },
      {
        creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        recipient_address: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7',
        amount: '10.0000000',
        memo: 'Domain Renewal',
        status: 'COMPLETED',
        contract_address: 'CCBUEU4J4YXGSWURDMKUONPNGQ4ETBACWO5PC7IL5H4DVNYWJLYFETGY',
        transaction_hash: '9a7b6c5d4e3f210987654321fedcba0987654321fedcba0987654321fedcba09',
        ledger: 104100,
      },
      {
        creator_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        recipient_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '15.5000000',
        memo: 'Project Advance',
        status: 'PROCESSING',
        contract_address: 'CCBUEU4J4YXGSWURDMKUONPNGQ4ETBACWO5PC7IL5H4DVNYWJLYFETGY',
        transaction_hash: '1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678ef90',
        ledger: 104190,
      },
    ];

    for (const p of initialPayments) {
      this.create(p);
    }
  }

  public list(filters?: {
    status?: PaymentStatus;
    creator?: string;
    recipient?: string;
  }): Payment[] {
    let results = Array.from(this.payments.values());

    if (filters?.status) {
      results = results.filter((p) => p.status === filters.status);
    }
    if (filters?.creator) {
      results = results.filter(
        (p) => p.creator_address.toLowerCase() === filters.creator!.toLowerCase()
      );
    }
    if (filters?.recipient) {
      results = results.filter(
        (p) => p.recipient_address.toLowerCase() === filters.recipient!.toLowerCase()
      );
    }

    return results.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public findById(id: string): Payment | undefined {
    return this.payments.get(id);
  }

  public findByOnChainId(onChainId: number): Payment | undefined {
    return Array.from(this.payments.values()).find(
      (p) => p.on_chain_id === onChainId
    );
  }

  public create(
    data: Omit<Payment, 'id' | 'on_chain_id' | 'created_at' | 'updated_at'> & {
      on_chain_id?: number;
    }
  ): Payment {
    this.counter += 1;
    const onChainId = data.on_chain_id || this.counter;
    const formattedId = `PAY-${String(onChainId).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const payment: Payment = {
      ...data,
      id: formattedId,
      on_chain_id: onChainId,
      created_at: now,
      updated_at: now,
    };

    this.payments.set(formattedId, payment);

    // Initial creation event
    this.recordEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      payment_id: formattedId,
      event_type: 'PaymentCreated',
      transaction_hash: data.transaction_hash || 'tx-initial',
      ledger: data.ledger || 0,
      payload: { amount: data.amount, recipient: data.recipient_address },
      created_at: now,
    });

    return payment;
  }

  public updateStatus(id: string, newStatus: PaymentStatus): Payment | undefined {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    // Invariant check: cannot update completed or cancelled
    if (payment.status === 'COMPLETED' || payment.status === 'CANCELLED') {
      return payment;
    }

    const now = new Date().toISOString();
    payment.status = newStatus;
    payment.updated_at = now;

    this.payments.set(id, payment);
    return payment;
  }

  public recordEvent(event: PaymentEvent): void {
    const list = this.events.get(event.payment_id) || [];
    list.push(event);
    this.events.set(event.payment_id, list);
  }

  public listEvents(paymentId: string): PaymentEvent[] {
    return this.events.get(paymentId) || [];
  }

  public isEventDuplicate(dedupKey: string): boolean {
    return this.processedEventHashes.has(dedupKey);
  }

  public markEventProcessed(dedupKey: string): void {
    this.processedEventHashes.add(dedupKey);
  }
}

export const paymentRepository = new PaymentRepository();
