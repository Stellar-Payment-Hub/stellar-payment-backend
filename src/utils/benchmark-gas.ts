/**
 * Soroban Gas & Resource Footprint Benchmarking Utility
 * Estimates CPU instructions, RAM byte consumption, and ledger footprint fees across contract methods.
 */

export interface ContractGasBenchmark {
  method: string;
  cpuInstructions: number;
  memoryBytes: number;
  readBytes: number;
  writeBytes: number;
  estimatedFeeStroops: number;
}

export const METHOD_GAS_PROFILES: Record<string, ContractGasBenchmark> = {
  create_payment: {
    method: 'create_payment',
    cpuInstructions: 1_250_000,
    memoryBytes: 45_000,
    readBytes: 1_200,
    writeBytes: 850,
    estimatedFeeStroops: 25_000,
  },
  complete_payment: {
    method: 'complete_payment',
    cpuInstructions: 950_000,
    memoryBytes: 38_000,
    readBytes: 1_850,
    writeBytes: 850,
    estimatedFeeStroops: 18_500,
  },
  execute_settlement_10_recipients: {
    method: 'execute_settlement_10_recipients',
    cpuInstructions: 3_800_000,
    memoryBytes: 120_000,
    readBytes: 4_500,
    writeBytes: 3_200,
    estimatedFeeStroops: 65_000,
  },
  execute_settlement_100_recipients: {
    method: 'execute_settlement_100_recipients',
    cpuInstructions: 18_500_000,
    memoryBytes: 520_000,
    readBytes: 25_000,
    writeBytes: 18_500,
    estimatedFeeStroops: 280_000,
  },
  raise_dispute: {
    method: 'raise_dispute',
    cpuInstructions: 1_100_000,
    memoryBytes: 42_000,
    readBytes: 1_500,
    writeBytes: 950,
    estimatedFeeStroops: 22_000,
  },
  resolve_dispute: {
    method: 'resolve_dispute',
    cpuInstructions: 2_400_000,
    memoryBytes: 68_000,
    readBytes: 2_200,
    writeBytes: 1_400,
    estimatedFeeStroops: 42_000,
  },
};

export function estimateResourceCost(method: string): ContractGasBenchmark {
  const profile = METHOD_GAS_PROFILES[method];
  if (!profile) {
    throw new Error(`Unknown method for gas benchmark: ${method}`);
  }
  return profile;
}

export function calculateBatchGasUsage(methods: string[]): {
  totalCpu: number;
  totalMemoryBytes: number;
  totalFeeStroops: number;
  totalFeeXlm: string;
} {
  let totalCpu = 0;
  let totalMemoryBytes = 0;
  let totalFeeStroops = 0;

  for (const m of methods) {
    const prof = estimateResourceCost(m);
    totalCpu += prof.cpuInstructions;
    totalMemoryBytes += prof.memoryBytes;
    totalFeeStroops += prof.estimatedFeeStroops;
  }

  const totalFeeXlm = (totalFeeStroops / 10_000_000).toFixed(7);

  return {
    totalCpu,
    totalMemoryBytes,
    totalFeeStroops,
    totalFeeXlm,
  };
}
