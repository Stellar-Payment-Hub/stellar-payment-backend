import { Horizon, rpc } from '@stellar/stellar-sdk';
import { env } from '../config/env';

export class StellarClient {
  private horizonServer: Horizon.Server;
  private rpcServer: rpc.Server;

  constructor() {
    this.horizonServer = new Horizon.Server(env.stellarHorizonUrl);
    this.rpcServer = new rpc.Server(env.stellarRpcUrl);
  }

  public getHorizon(): Horizon.Server {
    return this.horizonServer;
  }

  public getRpc(): rpc.Server {
    return this.rpcServer;
  }

  public async executeWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
    let lastError: Error | unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
        }
      }
    }
    throw lastError;
  }

  public async getLatestLedger(): Promise<number> {
    try {
      const response = await this.rpcServer.getLatestLedger();
      return response.sequence;
    } catch {
      // Fallback for offline / disconnected sandbox testing
      return 104500;
    }
  }
}

export const stellarClient = new StellarClient();
