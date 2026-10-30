export interface LedgerCheckpoint {
  lastLedgerSequence: number;
  lastProcessedAt: string;
  totalEventsIngested: number;
}

export class EventCheckpointManager {
  private checkpoint: LedgerCheckpoint = {
    lastLedgerSequence: 104000,
    lastProcessedAt: new Date().toISOString(),
    totalEventsIngested: 0,
  };

  public getCheckpoint(): LedgerCheckpoint {
    return { ...this.checkpoint };
  }

  public updateCheckpoint(sequence: number, eventCount = 1): void {
    if (sequence > this.checkpoint.lastLedgerSequence) {
      this.checkpoint.lastLedgerSequence = sequence;
    }
    this.checkpoint.totalEventsIngested += eventCount;
    this.checkpoint.lastProcessedAt = new Date().toISOString();
  }
}

export const eventCheckpointManager = new EventCheckpointManager();
