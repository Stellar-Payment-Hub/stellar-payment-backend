import { isValidStellarAddress as isValidAddress } from '../utils/stellar-address';

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePaymentRecord(data: any): PaymentValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Payment payload must be an object'] };
  }

  if (!data.payer || !isValidAddress(data.payer)) {
    errors.push('Payer must be a valid 56-character Stellar G... address');
  }
  if (!data.payee || !isValidAddress(data.payee)) {
    errors.push('Payee must be a valid 56-character Stellar G... address');
  }
  const amt = parseFloat(data.amount);
  if (isNaN(amt) || amt <= 0) {
    errors.push('Amount must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateSettlementConfig(data: any): PaymentValidationResult {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Settlement payload must be an object'] };
  }

  if (!data.payer || !isValidAddress(data.payer)) {
    errors.push('Payer must be a valid 56-character Stellar address');
  }

  if (!Array.isArray(data.recipients) || data.recipients.length === 0) {
    errors.push('Recipients must be a non-empty array');
  } else {
    let sum = 0;
    for (let i = 0; i < data.recipients.length; i++) {
      const r = data.recipients[i];
      if (!r.recipient || !isValidAddress(r.recipient)) {
        errors.push(`Recipient #${i + 1} has an invalid address`);
      }
      const s = parseFloat(r.amount);
      if (isNaN(s) || s <= 0) {
        errors.push(`Recipient #${i + 1} has an invalid amount`);
      } else {
        sum += s;
      }
    }

    const total = parseFloat(data.total_amount);
    if (isNaN(total) || Math.abs(sum - total) > 0.001) {
      errors.push(`Sum of recipient shares (${sum.toFixed(4)}) does not equal total amount (${total.toFixed(4)})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
