import { EventType, PaymentStatus } from '../database/schema';
import { processContractEvent, IngestEventInput } from './processor';
import { EventCheckpointManager, eventCheckpointManager } from './listener';
import { stellarClient } from '../services/stellar-client';

export interface SorobanRawEvent {
  id: string;
  pagingToken?: string;
  ledger: number;
  txHash: string;
  contractId?: string;
  type?: string;
  topic?: unknown[];
  value?: Record<string, unknown> | unknown;
}

export interface SorobanEventFilter {
  type?: 'contract' | 'system' | 'diagnostic';
  contractIds?: string[];
  topics?: string[][];
}

export interface SorobanGetEventsParams {
  startLedger?: number;
  filters?: SorobanEventFilter[];
  pagination?: {
    cursor?: string;
    limit?: number;
  };
}

export interface SorobanGetEventsResult {
  events: SorobanRawEvent[];
  latestLedger: number;
  cursor?: string;
}

export interface SorobanRpcAdapter {
  getLatestLedger(): Promise<{ sequence: number }>;
  getEvents(params: SorobanGetEventsParams): Promise<SorobanGetEventsResult>;
}

export interface LedgerGapRange {
  startLedger: number;
  endLedger: number;
}

export interface ReconciliationCycleReport {
  scannedRanges: LedgerGapRange[];
  gapLedgers: number[];
  eventsDiscovered: number;
  eventsBackfilled: number;
  duplicatesSkipped: number;
  unmatchedSkipped: number;
  lastCursor: string | null;
  latestLedger: number;
  completedAt: string;
}

export interface SorobanIndexerOptions {
  rpc?: SorobanRpcAdapter;
  checkpointManager?: EventCheckpointManager;
  contractIds?: string[];
  pollIntervalMs?: number;
  pageSize?: number;
  maxLedgerSpanPerScan?: number;
  ingestFn?: typeof processContractEvent;
  onError?: (error: unknown) => void;
}

const SUPPORTED_EVENT_TYPES: ReadonlySet<EventType> = new Set<EventType>([
  'PaymentCreated',
  'PaymentUpdated',
  'PaymentCompleted',
  'PaymentCancelled',
  'SettlementCreated',
  'SettlementRecipientProcessed',
  'SettlementCompleted',
  'SettlementCancelled',
]);

/**
 * Identifies missing ledger sequence numbers between `baselineLedger` (exclusive)
 * and `targetLedger` (inclusive), excluding ledgers already marked as indexed.
 */
export function detectMissingLedgers(
  baselineLedger: number,
  targetLedger: number,
  indexedLedgers: ReadonlySet<number>
): number[] {
  if (targetLedger <= baselineLedger) {
    return [];
  }

  const missing: number[] = [];
  for (let seq = baselineLedger + 1; seq <= targetLedger; seq++) {
    if (!indexedLedgers.has(seq)) {
      missing.push(seq);
    }
  }
  return missing;
}

/**
 * Coalesces sorted missing ledger numbers into contiguous [startLedger, endLedger] ranges,
 * splitting ranges wider than `maxSpan` so individual RPC queries stay bounded.
 */
export function coalesceLedgerGapRanges(
  missingLedgers: readonly number[],
  maxSpan = 500
): LedgerGapRange[] {
  if (missingLedgers.length === 0) {
    return [];
  }

  const sorted = [...missingLedgers].sort((a, b) => a - b);
  const ranges: LedgerGapRange[] = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const spanExceeded = current - rangeStart + 1 > maxSpan;
    if (current === prev + 1 && !spanExceeded) {
      prev = current;
    } else {
      ranges.push({ startLedger: rangeStart, endLedger: prev });
      rangeStart = current;
      prev = current;
    }
  }

  ranges.push({ startLedger: rangeStart, endLedger: prev });
  return ranges;
}

function extractEventType(event: SorobanRawEvent): EventType | null {
  if (Array.isArray(event.topic)) {
    for (const item of event.topic) {
      if (typeof item === 'string' && SUPPORTED_EVENT_TYPES.has(item as EventType)) {
        return item as EventType;
      }
    }
  }

  if (event.value && typeof event.value === 'object' && !Array.isArray(event.value)) {
    const record = event.value as Record<string, unknown>;
    if (
      typeof record.event_type === 'string' &&
      SUPPORTED_EVENT_TYPES.has(record.event_type as EventType)
    ) {
      return record.event_type as EventType;
    }
  }

  return null;
}

/**
 * Normalizes a raw Soroban RPC event into an `IngestEventInput` suitable for `processContractEvent`.
 */
export function mapSorobanEventToIngestInput(event: SorobanRawEvent): IngestEventInput | null {
  const eventType = extractEventType(event);
  if (!eventType || !event.txHash || typeof event.ledger !== 'number') {
    return null;
  }

  const valueObj =
    event.value && typeof event.value === 'object' && !Array.isArray(event.value)
      ? (event.value as Record<string, unknown>)
      : {};

  let paymentId = typeof valueObj.payment_id === 'string' ? valueObj.payment_id : undefined;
  let onChainId =
    typeof valueObj.on_chain_id === 'number' ? valueObj.on_chain_id : undefined;

  // Also check positional topic conventions: [EventName, payment_id | on_chain_id]
  if (!paymentId && onChainId === undefined && Array.isArray(event.topic) && event.topic.length > 1) {
    const secondTopic = event.topic[1];
    if (typeof secondTopic === 'string' && secondTopic.startsWith('PAY-')) {
      paymentId = secondTopic;
    } else if (typeof secondTopic === 'number' && Number.isInteger(secondTopic)) {
      onChainId = secondTopic;
    }
  }

  const newStatus =
    typeof valueObj.new_status === 'string'
      ? (valueObj.new_status as PaymentStatus)
      : undefined;

  return {
    event_type: eventType,
    payment_id: paymentId,
    on_chain_id: onChainId,
    transaction_hash: event.txHash,
    ledger: event.ledger,
    new_status: newStatus,
    payload: {
      ...valueObj,
      soroban_event_id: event.id,
      contract_id: event.contractId,
    },
  };
}

function createDefaultRpcAdapter(): SorobanRpcAdapter {
  const rpcServer = stellarClient.getRpc() as unknown as SorobanRpcAdapter;
  return {
    getLatestLedger: () => rpcServer.getLatestLedger(),
    getEvents: (params) => rpcServer.getEvents(params),
  };
}

/**
 * Cursor-based Soroban ledger indexer and background reconciliation daemon.
 * Detects missed ledger sequences (e.g. during transient RPC or SSE disconnections)
 * and backfills contract events idempotently.
 */
export class SorobanReconciliationDaemon {
  private readonly rpc: SorobanRpcAdapter;
  private readonly checkpointManager: EventCheckpointManager;
  private readonly contractIds: string[];
  private readonly pollIntervalMs: number;
  private readonly pageSize: number;
  private readonly maxLedgerSpanPerScan: number;
  private readonly ingestFn: typeof processContractEvent;
  private readonly onError?: (error: unknown) => void;

  private readonly indexedLedgers: Set<number> = new Set<number>();
  private readonly seenEventTokens: Set<string> = new Set<string>();
  private baselineLedger: number;
  private lastCursor: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;
  private completedCycles = 0;
  private failedCycles = 0;
  private lastErrorMessage: string | null = null;

  constructor(options: SorobanIndexerOptions = {}) {
    this.rpc = options.rpc ?? createDefaultRpcAdapter();
    this.checkpointManager = options.checkpointManager ?? eventCheckpointManager;
    this.contractIds = options.contractIds ?? [];
    this.pollIntervalMs = options.pollIntervalMs ?? 15000;
    this.pageSize = Math.max(1, Math.min(options.pageSize ?? 100, 1000));
    this.maxLedgerSpanPerScan = Math.max(1, options.maxLedgerSpanPerScan ?? 500);
    this.ingestFn = options.ingestFn ?? processContractEvent;
    this.onError = options.onError;
    this.baselineLedger = this.checkpointManager.getCheckpoint().lastLedgerSequence;
  }

  /**
   * Records that a live stream listener already observed a given ledger sequence,
   * allowing non-contiguous gaps (e.g. 104100 -> disconnect -> 104105) to be detected.
   */
  public markLedgerObserved(ledger: number): void {
    if (Number.isInteger(ledger) && ledger > 0) {
      this.indexedLedgers.add(ledger);
    }
  }

  public getCursor(): string | null {
    return this.lastCursor;
  }

  public isRunning(): boolean {
    return this.timer !== null;
  }

  public getDiagnostics(): {
    running: boolean;
    baselineLedger: number;
    lastCursor: string | null;
    completedCycles: number;
    failedCycles: number;
    lastErrorMessage: string | null;
    trackedLedgersCount: number;
  } {
    return {
      running: this.isRunning(),
      baselineLedger: this.baselineLedger,
      lastCursor: this.lastCursor,
      completedCycles: this.completedCycles,
      failedCycles: this.failedCycles,
      lastErrorMessage: this.lastErrorMessage,
      trackedLedgersCount: this.indexedLedgers.size,
    };
  }

  /**
   * Starts the background periodic reconciliation loop.
   */
  public start(): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = setInterval(() => {
      void this.reconcileOnce().catch((err) => {
        if (this.onError) {
          this.onError(err);
        }
      });
    }, this.pollIntervalMs);

    if (typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  /**
   * Stops the background reconciliation loop cleanly.
   */
  public stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Scans a single ledger range `[startLedger, endLedger]` using Soroban RPC cursor pagination.
   * Per Soroban RPC specification, page 1 specifies `startLedger`, and subsequent pages
   * specify `pagination.cursor` exclusively without `startLedger`.
   */
  public async scanRangeWithCursor(range: LedgerGapRange): Promise<{
    eventsDiscovered: number;
    eventsBackfilled: number;
    duplicatesSkipped: number;
    unmatchedSkipped: number;
    lastCursor: string | null;
  }> {
    let cursor: string | undefined;
    let eventsDiscovered = 0;
    let eventsBackfilled = 0;
    let duplicatesSkipped = 0;
    let unmatchedSkipped = 0;

    const filters: SorobanEventFilter[] | undefined =
      this.contractIds.length > 0
        ? [{ type: 'contract', contractIds: this.contractIds }]
        : undefined;

    for (;;) {
      const requestParams: SorobanGetEventsParams = cursor
        ? {
            filters,
            pagination: { cursor, limit: this.pageSize },
          }
        : {
            startLedger: range.startLedger,
            filters,
            pagination: { limit: this.pageSize },
          };

      const response = await this.rpc.getEvents(requestParams);
      const batch = response.events ?? [];

      if (batch.length === 0) {
        break;
      }

      let reachedBeyondEndLedger = false;

      for (const rawEvent of batch) {
        const token = rawEvent.pagingToken || rawEvent.id;
        if (token) {
          cursor = token;
          this.lastCursor = token;
        }

        if (rawEvent.ledger < range.startLedger) {
          continue;
        }

        if (rawEvent.ledger > range.endLedger) {
          reachedBeyondEndLedger = true;
          break;
        }

        eventsDiscovered += 1;

        const dedupToken = `${rawEvent.id || token || ''}:${rawEvent.txHash}:${rawEvent.ledger}`;
        if (this.seenEventTokens.has(dedupToken)) {
          duplicatesSkipped += 1;
          continue;
        }

        const mapped = mapSorobanEventToIngestInput(rawEvent);
        if (!mapped) {
          unmatchedSkipped += 1;
          continue;
        }

        const outcome = this.ingestFn(mapped);
        this.seenEventTokens.add(dedupToken);

        if (outcome.duplicate) {
          duplicatesSkipped += 1;
        } else if (outcome.processed) {
          eventsBackfilled += 1;
          this.checkpointManager.updateCheckpoint(rawEvent.ledger, 1);
        } else {
          unmatchedSkipped += 1;
        }
      }

      if (reachedBeyondEndLedger || batch.length < this.pageSize || !cursor) {
        break;
      }
    }

    for (let seq = range.startLedger; seq <= range.endLedger; seq++) {
      this.indexedLedgers.add(seq);
    }

    return {
      eventsDiscovered,
      eventsBackfilled,
      duplicatesSkipped,
      unmatchedSkipped,
      lastCursor: this.lastCursor,
    };
  }

  /**
   * Executes one complete reconciliation cycle:
   * 1. Queries latest Soroban ledger sequence
   * 2. Identifies all unindexed gap ledgers above `baselineLedger`
   * 3. Polls `getEvents` with cursor pagination across each gap range
   * 4. Advances contiguous `baselineLedger` watermark and prunes compacted ledger history
   */
  public async reconcileOnce(): Promise<ReconciliationCycleReport | null> {
    if (this.inFlight) {
      return null;
    }

    this.inFlight = true;
    try {
      const latest = await this.rpc.getLatestLedger();
      const observedMax =
        this.indexedLedgers.size > 0 ? Math.max(...this.indexedLedgers) : this.baselineLedger;
      const targetLedger = Math.max(latest.sequence, observedMax);

      const gapLedgers = detectMissingLedgers(
        this.baselineLedger,
        targetLedger,
        this.indexedLedgers
      );
      const scannedRanges = coalesceLedgerGapRanges(gapLedgers, this.maxLedgerSpanPerScan);

      let eventsDiscovered = 0;
      let eventsBackfilled = 0;
      let duplicatesSkipped = 0;
      let unmatchedSkipped = 0;

      for (const range of scannedRanges) {
        const stats = await this.scanRangeWithCursor(range);
        eventsDiscovered += stats.eventsDiscovered;
        eventsBackfilled += stats.eventsBackfilled;
        duplicatesSkipped += stats.duplicatesSkipped;
        unmatchedSkipped += stats.unmatchedSkipped;
      }

      // Advance contiguous baseline watermark and compact older ledger entries
      while (this.indexedLedgers.has(this.baselineLedger + 1)) {
        this.indexedLedgers.delete(this.baselineLedger + 1);
        this.baselineLedger += 1;
      }

      if (this.baselineLedger > this.checkpointManager.getCheckpoint().lastLedgerSequence) {
        this.checkpointManager.updateCheckpoint(this.baselineLedger, 0);
      }

      this.completedCycles += 1;
      this.lastErrorMessage = null;

      return {
        scannedRanges,
        gapLedgers,
        eventsDiscovered,
        eventsBackfilled,
        duplicatesSkipped,
        unmatchedSkipped,
        lastCursor: this.lastCursor,
        latestLedger: targetLedger,
        completedAt: new Date().toISOString(),
      };
    } catch (err) {
      this.failedCycles += 1;
      this.lastErrorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      this.inFlight = false;
    }
  }
}

export const sorobanReconciliationDaemon = new SorobanReconciliationDaemon();
