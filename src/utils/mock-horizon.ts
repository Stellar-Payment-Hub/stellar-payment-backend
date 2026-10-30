/**
 * Mock Stellar Horizon Server Harness
 * Emulates Horizon REST endpoints for fast, deterministic unit and integration tests.
 */

export interface MockAccountResponse {
  id: string;
  sequence: string;
  balances: Array<{
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
    balance: string;
  }>;
}

export class MockHorizonServer {
  private accounts: Map<string, MockAccountResponse> = new Map();
  private feeStats = {
    min: '100',
    mode: '100',
    p90: '150',
    ledger_capacity_usage: '0.15',
  };

  public seedAccount(address: string, balances: Array<{ code?: string; balance: string }>) {
    this.accounts.set(address, {
      id: address,
      sequence: '1000001',
      balances: balances.map(b => ({
        asset_type: b.code ? 'credit_alphanum4' : 'native',
        asset_code: b.code,
        balance: b.balance,
      })),
    });
  }

  public getAccount(address: string): MockAccountResponse {
    const acc = this.accounts.get(address);
    if (!acc) {
      throw new Error(`Horizon 404: Account not found ${address}`);
    }
    return acc;
  }

  public getFeeStats() {
    return this.feeStats;
  }
}
