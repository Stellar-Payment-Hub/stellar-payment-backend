#!/usr/bin/env node
/**
 * Gas Estimation Visual Chart Generator
 * Produces ASCII bar charts comparing CPU instructions and fees across contract methods.
 */
import { METHOD_GAS_PROFILES } from '../src/utils/benchmark-gas';

export function renderGasAsciiChart(): string {
  const maxCpu = 20_000_000;
  const lines: string[] = ['Soroban CPU Instruction Utilization (Max Budget: 100M):', ''];

  for (const [key, prof] of Object.entries(METHOD_GAS_PROFILES)) {
    const barLength = Math.round((prof.cpuInstructions / maxCpu) * 30);
    const bar = '█'.repeat(barLength).padEnd(30, '░');
    lines.push(`${prof.method.padEnd(32)} [${bar}] ${prof.cpuInstructions.toLocaleString()} CPU`);
  }

  return lines.join('\n');
}

if (process.argv[1]?.endsWith('gas-charts.ts')) {
  console.log(renderGasAsciiChart());
}
