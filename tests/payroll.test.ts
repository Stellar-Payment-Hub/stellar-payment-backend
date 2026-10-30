import { describe, it, expect } from 'vitest';
import { parseAndValidatePayrollCsv } from '../src/services/payroll-service';
import { calculateEqualSplit } from '../src/services/split-calculator';

describe('Payroll & Split Calculation', () => {
  it('parses valid CSV rows with ed25519 public keys', () => {
    const csv = `Recipient,Amount,Memo\nGBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5,150.00,Bonus\nGA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN,200.50,Salary`;
    const result = parseAndValidatePayrollCsv(csv);
    expect(result.canExecute).toBe(true);
    expect(result.totalRecipients).toBe(2);
    expect(result.validRecipients).toBe(2);
    expect(result.totalAmountXlm).toBe('350.5000000');
  });

  it('rejects invalid recipient addresses in CSV', () => {
    const csv = `Recipient,Amount\nInvalidAddress123,50.00`;
    const result = parseAndValidatePayrollCsv(csv);
    expect(result.canExecute).toBe(false);
    expect(result.rows[0].isValid).toBe(false);
  });

  it('allocates odd Stroop remainders safely to the final recipient', () => {
    const recipients = ['G_RECIP_1', 'G_RECIP_2', 'G_RECIP_3'];
    // 10 XLM = 100,000,000 Stroops / 3 = 33,333,333 each + 1 remainder
    const split = calculateEqualSplit(10, recipients);
    expect(split.remainderStroops).toBe(1);
    expect(split.allocations[0].stroops).toBe(33333333);
    expect(split.allocations[1].stroops).toBe(33333333);
    expect(split.allocations[2].stroops).toBe(33333334);
    expect(split.allocations[2].isRemainderReceiver).toBe(true);
  });
});
