export function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string' || str.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(str);
}

export function formatScValNumber(amount: number | bigint): string {
  return BigInt(amount).toString();
}

export function safeDecodeBase64(b64: string): Buffer | null {
  if (!isValidBase64(b64)) return null;
  try {
    return Buffer.from(b64, 'base64');
  } catch {
    return null;
  }
}
