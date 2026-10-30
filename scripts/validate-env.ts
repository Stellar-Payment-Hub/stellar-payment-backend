export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(env: Record<string, string | undefined>): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const network = env.STELLAR_NETWORK || 'testnet';
  const validNetworks = ['testnet', 'futurenet', 'standalone', 'public', 'mainnet'];
  if (!validNetworks.includes(network.toLowerCase())) {
    errors.push(`Invalid STELLAR_NETWORK: "${network}". Must be one of ${validNetworks.join(', ')}`);
  }

  if (env.PORT && isNaN(parseInt(env.PORT, 10))) {
    errors.push(`PORT must be a valid integer, received "${env.PORT}"`);
  }

  if (env.HORIZON_URL && !env.HORIZON_URL.startsWith('http')) {
    errors.push(`HORIZON_URL must be an HTTP(S) URL, received "${env.HORIZON_URL}"`);
  }

  if (env.SOROBAN_RPC_URL && !env.SOROBAN_RPC_URL.startsWith('http')) {
    errors.push(`SOROBAN_RPC_URL must be an HTTP(S) URL, received "${env.SOROBAN_RPC_URL}"`);
  }

  if (env.PAYMENT_REGISTRY_CONTRACT_ID) {
    if (!env.PAYMENT_REGISTRY_CONTRACT_ID.startsWith('C') || env.PAYMENT_REGISTRY_CONTRACT_ID.length !== 56) {
      warnings.push(`PAYMENT_REGISTRY_CONTRACT_ID should be a 56-character C... contract address`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
