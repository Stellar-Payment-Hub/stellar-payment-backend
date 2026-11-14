import { describe, it, expect } from 'vitest';
import { paymentRepository } from '../src/database/repository';
import { EventCheckpointManager } from '../src/events/listener';
import { processContractEvent } from '../src/events/processor';
import {
  detectMissingLedgers,
  coalesceLedgerGapRanges,
  SorobanReconciliationDaemon,
  SorobanRawEvent,
  SorobanRpcAdapter,
  SorobanGetEventsParams,
} from '../src/events/soroban-indexer';

function createSyntheticSorobanRpc(
  events: SorobanRawEvent[],
  initialLatestLedger: number
): {
  rpc: SorobanRpcAdapter;
  calls: SorobanGetEventsParams[];
  setLatestLedger: (seq: number) => void;
  setFailing: (shouldFail: boolean) => void;
} {
  let latestLedger = initialLatestLedger;
  let failing = false;
  const calls: SorobanGetEventsParams[] = [];

  const sortedEvents = [...events].sort((a, b) => {
    if (a.ledger !== b.ledger) return a.ledger - b.ledger;
    return a.id.localeCompare(b.id);
  });

  const rpc: SorobanRpcAdapter = {
    async getLatestLedger() {
      if (failing) {
        throw new Error('Simulated Soroban RPC network disconnection');
      }
      return { sequence: latestLedger };
    },
    async getEvents(params: SorobanGetEventsParams) {
      if (failing) {
        throw new Error('Simulated Soroban RPC network disconnection');
      }
      calls.push(params);

      const limit = params.pagination?.limit ?? 100;
      const cursor = params.pagination?.cursor;

      // Enforce Soroban RPC spec: startLedger and cursor cannot both be set
      if (params.startLedger !== undefined && cursor !== undefined) {
        throw new Error('Soroban RPC invalid params: startLedger and cursor are mutually exclusive');
      }

      let filtered = sortedEvents;
      if (params.filters && params.filters.length > 0) {
        const allowedContracts = new Set(
          params.filters.flatMap((f) => f.contractIds ?? [])
        );
        if (allowedContracts.size > 0) {
          filtered = filtered.filter(
            (e) => !e.contractId || allowedContracts.has(e.contractId)
          );
        }
      }

      let startIdx = 0;
      if (cursor) {
        const foundIdx = filtered.findIndex((e) => (e.pagingToken || e.id) === cursor);
        startIdx = foundIdx >= 0 ? foundIdx + 1 : filtered.length;
      } else if (params.startLedger !== undefined) {
        startIdx = filtered.findIndex((e) => e.ledger >= params.startLedger!);
        if (startIdx === -1) startIdx = filtered.length;
      }

      const slice = filtered.slice(startIdx, startIdx + limit);
      return {
        events: slice,
        latestLedger,
        cursor: slice.length > 0 ? slice[slice.length - 1].pagingToken || slice[slice.length - 1].id : cursor,
      };
    },
  };

  return {
    rpc,
    calls,
    setLatestLedger: (seq: number) => {
      latestLedger = seq;
    },
    setFailing: (shouldFail: boolean) => {
      failing = shouldFail;
    },
  };
}

describe('Automated Soroban Ledger Reconciliation Daemon (#18)', () => {
  it('detects non-contiguous ledger gaps and coalesces bounded scan ranges', () => {
    const indexed = new Set<number>([104001, 104005, 104006, 104010]);
    const missing = detectMissingLedgers(104000, 104010, indexed);
    expect(missing).toEqual([104002, 104003, 104004, 104007, 104008, 104009]);

    const ranges = coalesceLedgerGapRanges(missing, 2);
    expect(ranges).toEqual([
      { startLedger: 104002, endLedger: 104003 },
      { startLedger: 104004, endLedger: 104004 },
      { startLedger: 104007, endLedger: 104008 },
      { startLedger: 104009, endLedger: 104009 },
    ]);
  });

  it('detects and backfills synthetic missed ledger events across multi-page cursor pagination idempotently', async () => {
    const paymentA = paymentRepository.create({
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipient_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      amount: '42.0000000',
      memo: 'Reconciliation Gap A',
      status: 'PENDING',
      contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
      on_chain_id: 8801,
    });

    const paymentB = paymentRepository.create({
      creator_address: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
      recipient_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      amount: '19.5000000',
      memo: 'Reconciliation Gap B',
      status: 'PENDING',
      contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
      on_chain_id: 8802,
    });

    // Pre-ingest an already processed event to verify idempotent duplicate skipping
    processContractEvent({
      event_type: 'PaymentUpdated',
      payment_id: paymentA.id,
      transaction_hash: 'tx-already-seen-8801',
      ledger: 104002,
    });

    const syntheticEvents: SorobanRawEvent[] = [
      {
        id: '0104002-0001',
        pagingToken: 'cursor-104002-1',
        ledger: 104002,
        txHash: 'tx-already-seen-8801',
        contractId: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        topic: ['PaymentUpdated', paymentA.id],
        value: { payment_id: paymentA.id },
      },
      {
        id: '0104003-0001',
        pagingToken: 'cursor-104003-1',
        ledger: 104003,
        txHash: 'tx-missed-complete-8801',
        contractId: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        topic: ['PaymentCompleted'],
        value: { on_chain_id: 8801 },
      },
      {
        id: '0104004-0001',
        pagingToken: 'cursor-104004-1',
        ledger: 104004,
        txHash: 'tx-missed-cancel-8802',
        contractId: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        topic: ['PaymentCancelled', 8802],
        value: {},
      },
    ];

    const checkpointManager = new EventCheckpointManager(); // baseline = 104000
    const mock = createSyntheticSorobanRpc(syntheticEvents, 104006);

    // Simulate live listener saw 104001 and 104006, missing 104002..104005 during disconnect
    const daemon = new SorobanReconciliationDaemon({
      rpc: mock.rpc,
      checkpointManager,
      contractIds: ['CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S'],
      pageSize: 2, // Force multi-page cursor pagination
    });
    daemon.markLedgerObserved(104001);
    daemon.markLedgerObserved(104006);

    const report = await daemon.reconcileOnce();
    expect(report).not.toBeNull();
    expect(report!.gapLedgers).toEqual([104002, 104003, 104004, 104005]);
    expect(report!.scannedRanges).toEqual([{ startLedger: 104002, endLedger: 104005 }]);
    expect(report!.eventsDiscovered).toBe(3);
    expect(report!.eventsBackfilled).toBe(2);
    expect(report!.duplicatesSkipped).toBe(1);
    expect(report!.lastCursor).toBe('cursor-104004-1');

    // Verify multi-page cursor call used cursor without startLedger
    expect(mock.calls.length).toBe(2);
    expect(mock.calls[0].startLedger).toBe(104002);
    expect(mock.calls[0].pagination?.cursor).toBeUndefined();
    expect(mock.calls[1].startLedger).toBeUndefined();
    expect(mock.calls[1].pagination?.cursor).toBe('cursor-104003-1');

    // Verify payment states were backfilled accurately
    expect(paymentRepository.findById(paymentA.id)?.status).toBe('COMPLETED');
    expect(paymentRepository.findById(paymentB.id)?.status).toBe('CANCELLED');
    expect(checkpointManager.getCheckpoint().lastLedgerSequence).toBe(104006);

    // Re-running reconciliation on the same ledger height performs 0 duplicate mutations
    const secondReport = await daemon.reconcileOnce();
    expect(secondReport!.gapLedgers).toEqual([]);
    expect(secondReport!.eventsBackfilled).toBe(0);
  });

  it('recovers automatically after transient Soroban RPC disconnection and manages start/stop lifecycle', async () => {
    const paymentC = paymentRepository.create({
      creator_address: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      recipient_address: 'GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7',
      amount: '75.0000000',
      memo: 'Disconnect Recovery Test',
      status: 'PENDING',
      contract_address: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
      on_chain_id: 8803,
    });

    const events: SorobanRawEvent[] = [
      {
        id: '0104002-9999',
        pagingToken: 'cursor-recovery-1',
        ledger: 104002,
        txHash: 'tx-recovery-8803',
        contractId: 'CD5D7OITCBFJJDHQVEZ6Y7MYIZSWEVOCQO4ES7WZEWW3S37IGUVZAI7S',
        topic: ['PaymentCompleted', paymentC.id],
        value: { payment_id: paymentC.id },
      },
    ];

    const checkpointManager = new EventCheckpointManager();
    const mock = createSyntheticSorobanRpc(events, 104003);
    mock.setFailing(true);

    const daemon = new SorobanReconciliationDaemon({
      rpc: mock.rpc,
      checkpointManager,
      pollIntervalMs: 60000,
    });

    await expect(daemon.reconcileOnce()).rejects.toThrow('disconnection');
    expect(daemon.getDiagnostics().failedCycles).toBe(1);
    expect(paymentRepository.findById(paymentC.id)?.status).toBe('PENDING');

    // Reconnect RPC and run periodic daemon lifecycle
    mock.setFailing(false);
    daemon.start();
    expect(daemon.isRunning()).toBe(true);

    const recovered = await daemon.reconcileOnce();
    daemon.stop();
    expect(daemon.isRunning()).toBe(false);

    expect(recovered!.eventsBackfilled).toBe(1);
    expect(paymentRepository.findById(paymentC.id)?.status).toBe('COMPLETED');
    expect(daemon.getDiagnostics().completedCycles).toBe(1);
    expect(daemon.getDiagnostics().lastErrorMessage).toBeNull();
  });
});
