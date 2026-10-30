import { describe, it, expect } from 'vitest';

describe('Dispute Resolution Lifecycle', () => {
  interface DisputeState {
    id: string;
    paymentId: string;
    raisedBy: string;
    status: 'OPEN' | 'RESOLVED_REFUND' | 'RESOLVED_MERCHANT';
    verdict?: string;
  }

  it('progresses dispute through full lifecycle from raise to refund verdict', () => {
    let dispute: DisputeState = {
      id: 'DISP-001',
      paymentId: 'PAY-101',
      raisedBy: 'GUSER_BUYER',
      status: 'OPEN',
    };

    expect(dispute.status).toBe('OPEN');

    // Arbitrator resolves dispute with refund to buyer
    const resolveDispute = (disp: DisputeState, callerRole: string, verdict: 'REFUND' | 'MERCHANT'): DisputeState => {
      if (callerRole !== 'ARBITRATOR') {
        throw new Error('Unauthorized');
      }
      return {
        ...disp,
        status: verdict === 'REFUND' ? 'RESOLVED_REFUND' : 'RESOLVED_MERCHANT',
        verdict: `Arbitrator approved ${verdict}`,
      };
    };

    dispute = resolveDispute(dispute, 'ARBITRATOR', 'REFUND');
    expect(dispute.status).toBe('RESOLVED_REFUND');
    expect(dispute.verdict).toContain('Arbitrator approved REFUND');
  });
});
