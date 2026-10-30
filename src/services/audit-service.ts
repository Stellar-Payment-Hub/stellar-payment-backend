export interface SystemAuditEntry {
  id: string;
  action: string;
  actor: string;
  targetId?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export class AuditService {
  private logs: SystemAuditEntry[] = [];

  public record(action: string, actor: string, details: Record<string, unknown>, targetId?: string): SystemAuditEntry {
    const entry: SystemAuditEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      actor,
      targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
    return entry;
  }

  public getRecentLogs(limit = 50): SystemAuditEntry[] {
    return this.logs.slice(-limit).reverse();
  }
}

export const auditService = new AuditService();
