#!/usr/bin/env node
/**
 * Test Account Balance Monitor & Faucet Auto-Refill Alert
 * Monitors testnet keypair balances and alerts when native XLM falls below reserve limits.
 */

export interface FaucetMonitorReport {
  address: string;
  currentBalance: number;
  lowBalanceAlert: boolean;
  recommendedAction: string;
}

export function checkAccountReserve(address: string, balanceStr: string, minReserve: number = 50): FaucetMonitorReport {
  const balance = parseFloat(balanceStr) || 0;
  const isLow = balance < minReserve;

  return {
    address,
    currentBalance: balance,
    lowBalanceAlert: isLow,
    recommendedAction: isLow ? 'Trigger SDF Friendbot refill' : 'Balance sufficient',
  };
}
