export interface ExchangeRates {
  base: string; // e.g. "USD"
  rates: Record<string, number>;
  timestamp: string;
}

export class OracleService {
  private rates: Record<string, number> = {
    XLM: 0.125, // 1 XLM = $0.125 USD
    USDC: 1.0,  // 1 USDC = $1.00 USD
    EURC: 1.08, // 1 EURC = $1.08 USD
  };

  public getRates(): ExchangeRates {
    return {
      base: 'USD',
      rates: { ...this.rates },
      timestamp: new Date().toISOString(),
    };
  }

  public convert(amount: number, fromAsset: string, toAsset: string): number {
    const fromRate = this.rates[fromAsset.toUpperCase()] || 1.0;
    const toRate = this.rates[toAsset.toUpperCase()] || 1.0;
    const inUsd = amount * fromRate;
    return inUsd / toRate;
  }
}

export const oracleService = new OracleService();
