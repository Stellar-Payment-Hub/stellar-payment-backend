/**
 * Ledger Storage Footprint & TTL Analyzer
 * Measures persistent and temporary storage footprint for Soroban state management.
 */

export interface StorageRecord {
  key: string;
  type: 'Persistent' | 'Temporary' | 'Instance';
  sizeBytes: number;
  currentLedgerTtl: number;
  minTtlThreshold: number;
}

export function analyzeStorageFootprint(records: StorageRecord[]): {
  totalBytes: number;
  persistentBytes: number;
  temporaryBytes: number;
  recordsNeedingExtension: StorageRecord[];
  estimatedRentStroops: number;
} {
  let totalBytes = 0;
  let persistentBytes = 0;
  let temporaryBytes = 0;
  const recordsNeedingExtension: StorageRecord[] = [];

  for (const rec of records) {
    totalBytes += rec.sizeBytes;
    if (rec.type === 'Persistent') persistentBytes += rec.sizeBytes;
    else if (rec.type === 'Temporary') temporaryBytes += rec.sizeBytes;

    if (rec.currentLedgerTtl < rec.minTtlThreshold) {
      recordsNeedingExtension.push(rec);
    }
  }

  // Estimated rent: ~100 Stroops per KB per 10,000 ledgers
  const estimatedRentStroops = Math.ceil((totalBytes / 1024) * 100);

  return {
    totalBytes,
    persistentBytes,
    temporaryBytes,
    recordsNeedingExtension,
    estimatedRentStroops,
  };
}
