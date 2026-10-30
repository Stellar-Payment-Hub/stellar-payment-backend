const STROOPS_PER_XLM = 10_000_000n;

export function toStroops(amount: string | number): bigint {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num) || num <= 0) return 0n;
  return BigInt(Math.round(num * 10_000_000));
}

export function fromStroops(stroops: bigint | string | number): string {
  const big = BigInt(stroops);
  const whole = big / STROOPS_PER_XLM;
  const fraction = big % STROOPS_PER_XLM;
  const paddedFraction = fraction.toString().padStart(7, '0').replace(/0+$/, '');
  return paddedFraction.length > 0 ? `${whole}.${paddedFraction}` : whole.toString();
}

export function formatStroopsDisplay(stroops: bigint | string | number): string {
  return `${BigInt(stroops).toLocaleString()} Stroops`;
}
