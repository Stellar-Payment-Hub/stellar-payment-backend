#!/usr/bin/env node
/**
 * Contract State Snapshot & Restore Utility
 * Saves and restores mock ledger state for reproducible test runs.
 */

export interface LedgerSnapshot {
  timestamp: string;
  network: string;
  entries: Record<string, any>;
}

export class StateSnapshotManager {
  private snapshots: Map<string, LedgerSnapshot> = new Map();

  public takeSnapshot(snapshotName: string, stateEntries: Record<string, any>): LedgerSnapshot {
    const snap: LedgerSnapshot = {
      timestamp: new Date().toISOString(),
      network: 'testnet',
      entries: JSON.parse(JSON.stringify(stateEntries)),
    };
    this.snapshots.set(snapshotName, snap);
    return snap;
  }

  public restoreSnapshot(snapshotName: string): Record<string, any> {
    const snap = this.snapshots.get(snapshotName);
    if (!snap) {
      throw new Error(`Snapshot '${snapshotName}' not found`);
    }
    return JSON.parse(JSON.stringify(snap.entries));
  }
}
