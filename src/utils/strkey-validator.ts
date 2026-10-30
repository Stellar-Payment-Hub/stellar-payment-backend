export type StrKeyType = 'Account' | 'Contract' | 'Secret' | 'Invalid';

export function classifyStrKey(key: string): StrKeyType {
  if (!key || typeof key !== 'string' || key.length !== 56) {
    return 'Invalid';
  }

  const validBase32 = /^[A-Z2-7]{56}$/;
  if (!validBase32.test(key)) {
    return 'Invalid';
  }

  const prefix = key.charAt(0);
  if (prefix === 'G') return 'Account';
  if (prefix === 'C') return 'Contract';
  if (prefix === 'S') return 'Secret';

  return 'Invalid';
}

export function isValidAccountPublicKey(key: string): boolean {
  return classifyStrKey(key) === 'Account';
}

export function isValidContractAddress(key: string): boolean {
  return classifyStrKey(key) === 'Contract';
}
