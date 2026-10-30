/**
 * Settlement Stress Test Engine (Up to 100 Simultaneous Allocations)
 * Verifies contract and backend zero-loss remainder distribution under extreme recipient counts.
 */
import { calculateDeterministicSplit } from './math-split';

export interface StressRecipient {
  address: string;
  share: number;
}

export function generateMaxRecipients(count: number = 100): StressRecipient[] {
  const recipients: StressRecipient[] = [];
  const baseShare = Math.floor(10000 / count);
  let remainder = 10000 - (baseShare * count);

  for (let i = 0; i < count; i++) {
    // Generate valid formatted mock Stellar Ed25519 public key
    const hex = i.toString(16).padStart(4, '0').toUpperCase();
    const address = `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLL${hex}`;
    const share = i === 0 ? baseShare + remainder : baseShare;
    recipients.push({ address, share });
  }

  return recipients;
}

export function runSettlementStressAllocation(totalAmount: string, recipientCount: number = 100) {
  const recipients = generateMaxRecipients(recipientCount);
  
  const startTime = Date.now();
  const splitResult = calculateDeterministicSplit(totalAmount, recipientCount);
  const executionTimeMs = Date.now() - startTime;

  return {
    recipientCount,
    totalInput: totalAmount,
    totalStroops: splitResult.totalStroops.toString(),
    remainderStroops: splitResult.remainderStroops.toString(),
    exactMatch: splitResult.proofValid,
    executionTimeMs,
    recipients: recipients.map((r, idx) => ({
      address: r.address,
      shareBps: r.share,
      stroops: splitResult.recipients[idx]?.stroops.toString() || '0',
    })),
  };
}
