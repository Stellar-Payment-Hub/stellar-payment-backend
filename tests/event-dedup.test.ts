import { describe, it, expect } from 'vitest';
import { eventDeduplicator } from '../src/events/dedup';
import { eventCheckpointManager } from '../src/events/listener';

describe('Event Deduplication & Checkpointing', () => {
  it('deduplicates repetitive event transaction hashes', () => {
    const hash = '0xunique12345';
    expect(eventDeduplicator.isDuplicate(hash)).toBe(false);
    expect(eventDeduplicator.isDuplicate(hash)).toBe(true);
  });

  it('updates and advances ledger checkpoint sequence', () => {
    const cp = eventCheckpointManager.getCheckpoint();
    eventCheckpointManager.updateCheckpoint(cp.lastLedgerSequence + 5, 2);
    const updated = eventCheckpointManager.getCheckpoint();
    expect(updated.lastLedgerSequence).toBe(cp.lastLedgerSequence + 5);
    expect(updated.totalEventsIngested).toBe(cp.totalEventsIngested + 2);
  });
});
