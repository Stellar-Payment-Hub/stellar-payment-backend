import { describe, it, expect } from 'vitest';
import { paymentRepository } from '../src/database/repository';

describe('PaymentRepository Enhanced Queries', () => {
  it('queries payments with memo search and status filter', () => {
    const result = (paymentRepository as any).queryPayments({
      search: 'Invoice',
      status: 'PENDING',
    });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].status).toBe('PENDING');
  });

  it('performs cursor-based pagination seamlessly', () => {
    const page1 = (paymentRepository as any).paginateWithCursor({ limit: 1 });
    expect(page1.data.length).toBe(1);
    expect(page1.nextCursor).toBeDefined();

    const page2 = (paymentRepository as any).paginateWithCursor({
      cursor: page1.nextCursor,
      limit: 1,
    });
    expect(page2.data.length).toBe(1);
    expect(page2.data[0].id).not.toBe(page1.data[0].id);
  });
});
