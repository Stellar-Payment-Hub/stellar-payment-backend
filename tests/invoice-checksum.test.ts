import { describe, it, expect } from 'vitest';
import { generateInvoiceChecksum, verifyInvoiceChecksum } from '../src/services/request-service';

describe('Verifiable Invoices', () => {
  it('generates valid checksum and passes verification', () => {
    const invoiceData = {
      id: 'REQ-100',
      requester: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '50.0000',
      asset: 'XLM',
      memo: 'Test invoice',
      expiresAt: '2026-12-31T23:59:59Z',
    };
    const checksum = generateInvoiceChecksum(invoiceData);
    expect(checksum.length).toBe(64);

    const valid = verifyInvoiceChecksum({ ...invoiceData, checksum });
    expect(valid).toBe(true);

    const tampered = verifyInvoiceChecksum({ ...invoiceData, amount: '999.00', checksum });
    expect(tampered).toBe(false);
  });
});
