import { StrKey } from '@stellar/stellar-sdk';

export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return StrKey.isValidEd25519PublicKey(address);
}

export function isValidContractAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return StrKey.isValidContract(address);
}

export function truncateAddress(address: string, start = 4, end = 4): string {
  if (!address || address.length < start + end + 2) return address;
  return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
}
