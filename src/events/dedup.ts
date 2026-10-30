export class EventDeduplicator {
  private seenHashes: Map<string, number> = new Map();
  private readonly WINDOW_MS = 600000; // 10 minutes

  public isDuplicate(hash: string): boolean {
    const now = Date.now();
    this.cleanExpired(now);

    if (this.seenHashes.has(hash)) {
      return true;
    }
    this.seenHashes.set(hash, now + this.WINDOW_MS);
    return false;
  }

  private cleanExpired(now: number): void {
    for (const [hash, expiresAt] of this.seenHashes.entries()) {
      if (expiresAt <= now) {
        this.seenHashes.delete(hash);
      }
    }
  }

  public size(): number {
    return this.seenHashes.size;
  }
}

export const eventDeduplicator = new EventDeduplicator();
