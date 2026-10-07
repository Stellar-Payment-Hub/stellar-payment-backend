import {
  Payment,
  PaymentEvent,
  PaymentStatus,
  Settlement,
  SettlementRecipient,
  SettlementStatus,
  PaymentRequest,
  TransactionRecord,
} from './schema';

class PaymentRepository {
  private payments: Map<string, Payment> = new Map();
  private settlements: Map<string, Settlement> = new Map();
  private paymentRequests: Map<string, PaymentRequest> = new Map();
  private transactions: Map<string, TransactionRecord> = new Map();
  private events: Map<string, PaymentEvent[]> = new Map();
  private processedEventHashes: Set<string> = new Set();
  private counter: number = 0;
  private settlementCounter: number = 0;
  private requestCounter: number = 0;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Seed initial demo payments
    const initialPayments: Omit<Payment, 'id' | 'on_chain_id' | 'created_at' | 'updated_at'>[] = [
      {
        creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        amount: '25.0000000',
        memo: 'Invoice #1042',
        status: 'PENDING',
        contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        transaction_hash: '342eb1e83ad159e628bb047e741e95632717c45bb438eb7a87dbb401f0bc247f',
        ledger: 104250,
      },
      {
        creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        recipient_address: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7',
        amount: '10.0000000',
        memo: 'Domain Renewal',
        status: 'COMPLETED',
        contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        transaction_hash: '9a7b6c5d4e3f210987654321fedcba0987654321fedcba0987654321fedcba09',
        ledger: 104100,
      },
      {
        creator_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
        recipient_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        amount: '15.5000000',
        memo: 'Project Advance',
        status: 'PROCESSING',
        contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        transaction_hash: '1234abcd5678ef901234abcd5678ef901234abcd5678ef901234abcd5678ef90',
        ledger: 104190,
      },
    ];

    for (const p of initialPayments) {
      this.create(p);
    }

    // Seed initial demo multi-recipient settlement
    this.createSettlement({
      payer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      total_amount: '100.0000000',
      memo: 'Sprint Multi-Address Payout',
      contract_address: 'CAGDS3H6GSNB7FSSFFDAAO5MX3GNVCUBNKIVUI52TAK7PXUUEXYCM66E',
      transaction_hash: '7789a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef',
      ledger: 104300,
      recipients: [
        { recipient: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', amount: '50.0000000' },
        { recipient: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7', amount: '30.0000000' },
        { recipient: 'GD6W7Z4DF57Q3B6U2L8K7X9V1N4P0M2Y6W6X7XF5Q2VLL4X7R7SD5XYZ', amount: '20.0000000' },
      ],
    });

    // Seed demo payment request
    this.createPaymentRequest({
      requester: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '25.0000',
      memo: 'Design Consultation #204',
      expiresInHours: 72,
    });

    // Seed initial transactions
    this.addTransaction({
      hash: '342eb1e83ad159e628bb047e741e95632717c45bb438eb7a87dbb401f0bc247f',
      source: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      destination: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '25.0000 XLM',
      asset: 'native',
      type: 'Contract Payment',
      status: 'Success',
      ledger: 104250,
    });
    this.addTransaction({
      hash: '9a7b6c5d4e3f210987654321fedcba0987654321fedcba0987654321fedcba09',
      source: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      destination: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7',
      amount: '10.0000 XLM',
      asset: 'native',
      type: 'Contract Payment',
      status: 'Success',
      ledger: 104100,
    });
    this.addTransaction({
      hash: '7789a1b2c3d4e5f60123456789abcdef0123456789abcdef0123456789abcdef',
      source: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      destination: 'CAGDS3H6GSNB7FSSFFDAAO5MX3GNVCUBNKIVUI52TAK7PXUUEXYCM66E',
      amount: '100.0000 XLM',
      asset: 'native',
      type: 'Settlement',
      status: 'Success',
      ledger: 104300,
    });
  }

  // --- Payment Methods ---
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
      results = results.filter((p) => p.creator_address === filters.creator);
    }
    if (filters?.recipient) {
      results = results.filter((p) => p.recipient_address === filters.recipient);
    }

    return results.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
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
    const idNum = data.on_chain_id !== undefined ? data.on_chain_id : this.counter + 1;
    this.counter = Math.max(this.counter, idNum);
    const formattedId = `PAY-${String(idNum).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const payment: Payment = {
      id: formattedId,
      on_chain_id: idNum,
      creator_address: data.creator_address,
      recipient_address: data.recipient_address,
      amount: data.amount,
      memo: data.memo || '',
      status: data.status || 'PENDING',
      contract_address: data.contract_address,
      transaction_hash: data.transaction_hash,
      ledger: data.ledger,
      created_at: now,
      updated_at: now,
    };

    this.payments.set(formattedId, payment);

    this.recordEvent({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      payment_id: formattedId,
      event_type: 'PaymentCreated',
      transaction_hash: data.transaction_hash || `tx-init-${formattedId}`,
      ledger: data.ledger || 104000,
      payload: { amount: data.amount, recipient: data.recipient_address },
      created_at: now,
    });

    return payment;
  }

  public updateStatus(id: string, newStatus: PaymentStatus): Payment | undefined {
    const payment = this.payments.get(id);
    if (!payment) return undefined;

    payment.status = newStatus;
    payment.updated_at = new Date().toISOString();
    this.payments.set(id, payment);
    return payment;
  }

  // --- Settlement Methods ---
  public listSettlements(filters?: { payer?: string; status?: SettlementStatus }): Settlement[] {
    let results = Array.from(this.settlements.values());
    if (filters?.payer) {
      results = results.filter((s) => s.payer === filters.payer);
    }
    if (filters?.status) {
      results = results.filter((s) => s.status === filters.status);
    }
    return results.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  public findSettlementById(id: string): Settlement | undefined {
    return this.settlements.get(id);
  }

  public createSettlement(data: {
    payer: string;
    total_amount: string;
    memo: string;
    contract_address?: string;
    transaction_hash?: string;
    ledger?: number;
    recipients: { recipient: string; amount: string }[];
  }): Settlement {
    this.settlementCounter += 1;
    const formattedId = `SETTLE-${String(this.settlementCounter).padStart(3, '0')}`;
    const now = new Date().toISOString();

    const recipientShares: SettlementRecipient[] = data.recipients.map((r, idx) => ({
      id: `${formattedId}-REC-${idx + 1}`,
      settlement_id: formattedId,
      recipient: r.recipient,
      amount: r.amount,
      status: 'PENDING',
    }));

    const settlement: Settlement = {
      id: formattedId,
      on_chain_id: this.settlementCounter,
      payer: data.payer,
      total_amount: data.total_amount,
      recipient_count: recipientShares.length,
      memo: data.memo || '',
      status: 'CREATED',
      contract_address:
        data.contract_address || 'CAGDS3H6GSNB7FSSFFDAAO5MX3GNVCUBNKIVUI52TAK7PXUUEXYCM66E',
      recipients: recipientShares,
      sub_payment_ids: [],
      transaction_hash: data.transaction_hash,
      ledger: data.ledger,
      created_at: now,
      updated_at: now,
    };

    this.settlements.set(formattedId, settlement);
    return settlement;
  }

  public executeSettlement(id: string, subPaymentIds: string[] = []): Settlement | undefined {
    const settlement = this.settlements.get(id);
    if (!settlement) return undefined;

    settlement.status = 'COMPLETED';
    settlement.sub_payment_ids = subPaymentIds;
    settlement.recipients = settlement.recipients.map((r, i) => ({
      ...r,
      status: 'COMPLETED',
      sub_payment_id: subPaymentIds[i] || `PAY-SUB-${i + 1}`,
    }));
    settlement.updated_at = new Date().toISOString();
    this.settlements.set(id, settlement);
    return settlement;
  }

  public cancelSettlement(id: string): Settlement | undefined {
    const settlement = this.settlements.get(id);
    if (!settlement) return undefined;

    settlement.status = 'CANCELLED';
    settlement.updated_at = new Date().toISOString();
    this.settlements.set(id, settlement);
    return settlement;
  }

  // --- Payment Request Methods ---
  public createPaymentRequest(data: {
    requester: string;
    amount: string;
    memo: string;
    expiresInHours?: number;
  }): PaymentRequest {
    this.requestCounter += 1;
    const formattedId = `REQ-${String(this.requestCounter).padStart(3, '0')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (data.expiresInHours || 48) * 3600 * 1000);

    const request: PaymentRequest = {
      id: formattedId,
      requester: data.requester,
      amount: data.amount,
      memo: data.memo,
      status: 'ACTIVE',
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    this.paymentRequests.set(formattedId, request);
    return request;
  }

  public findPaymentRequestById(id: string): PaymentRequest | undefined {
    return this.paymentRequests.get(id);
  }

  public markPaymentRequestPaid(
    id: string,
    paidBy: string,
    txHash: string
  ): PaymentRequest | undefined {
    const req = this.paymentRequests.get(id);
    if (!req) return undefined;

    req.status = 'PAID';
    req.paid_by = paidBy;
    req.transaction_hash = txHash;
    this.paymentRequests.set(id, req);
    return req;
  }

  // --- Transaction Records ---
  public listTransactions(): TransactionRecord[] {
    return Array.from(this.transactions.values()).sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1
    );
  }

  public addTransaction(data: Omit<TransactionRecord, 'id' | 'created_at'>): TransactionRecord {
    const id = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const tx: TransactionRecord = {
      id,
      hash: data.hash,
      source: data.source,
      destination: data.destination,
      amount: data.amount,
      asset: data.asset,
      type: data.type,
      status: data.status,
      ledger: data.ledger,
      created_at: new Date().toISOString(),
    };
    this.transactions.set(data.hash, tx);
    return tx;
  }

  // --- Event & Idempotency Logging ---
  public isEventProcessed(eventType: string, transactionHash: string): boolean {
    const key = `${eventType}:${transactionHash}`;
    return this.processedEventHashes.has(key);
  }

  public isEventDuplicate(key: string): boolean {
    return this.processedEventHashes.has(key);
  }

  public markEventProcessed(key: string): void {
    this.processedEventHashes.add(key);
  }

  public recordEvent(event: PaymentEvent): void {
    const targetKey = event.payment_id || event.settlement_id || 'global';
    const list = this.events.get(targetKey) || [];
    list.push(event);
    this.events.set(targetKey, list);
  }

  public listEvents(targetId: string): PaymentEvent[] {
    return this.events.get(targetId) || [];
  }
}

export const paymentRepository = new PaymentRepository();
