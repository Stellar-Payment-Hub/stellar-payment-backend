import { StrKey } from '@stellar/stellar-sdk';

export interface PayrollRow {
  recipient: string;
  amount: string;
  memo?: string;
  isValid: boolean;
  error?: string;
}

export interface PayrollValidationResult {
  totalRecipients: number;
  validRecipients: number;
  totalAmountXlm: string;
  rows: PayrollRow[];
  canExecute: boolean;
}

export function parseAndValidatePayrollCsv(csvContent: string): PayrollValidationResult {
  const lines = csvContent.trim().split(/\r?\n/);
  const rows: PayrollRow[] = [];
  let totalXlm = 0;
  let validCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (i === 0 && line.toLowerCase().includes('recipient'))) {
      continue; // Skip header or empty lines
    }

    const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const recipient = parts[0] || '';
    const amountStr = parts[1] || '0';
    const memo = parts[2] || 'Payroll';

    let isValid = true;
    let error: string | undefined;

    if (!StrKey.isValidEd25519PublicKey(recipient)) {
      isValid = false;
      error = 'Invalid Stellar public key format';
    } else {
      const parsedAmount = parseFloat(amountStr);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        isValid = false;
        error = 'Invalid amount value';
      } else {
        totalXlm += parsedAmount;
        validCount++;
      }
    }

    rows.push({ recipient, amount: amountStr, memo, isValid, error });
  }

  return {
    totalRecipients: rows.length,
    validRecipients: validCount,
    totalAmountXlm: totalXlm.toFixed(7),
    rows,
    canExecute: rows.length > 0 && validCount === rows.length,
  };
}
