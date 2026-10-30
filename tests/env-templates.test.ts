import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Environment Variable Templates Synchronization', () => {
  const readEnvKeys = (filePath: string): string[] => {
    const content = fs.readFileSync(filePath, 'utf8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .map(line => line.split('=')[0].trim());
  };

  it('ensures staging and production templates specify mandatory Stellar keys', () => {
    const prodKeys = readEnvKeys(path.resolve(process.cwd(), '.env.production.example'));
    const stagingKeys = readEnvKeys(path.resolve(process.cwd(), '.env.staging.example'));

    const mandatoryKeys = [
      'PORT',
      'CORS_ORIGIN',
      'STELLAR_NETWORK',
      'STELLAR_HORIZON_URL',
      'SOROBAN_RPC_URL',
      'STELLAR_NETWORK_PASSPHRASE',
      'PAYMENT_HUB_CONTRACT_ID',
      'SETTLEMENT_CONTRACT_ID',
      'ADMIN_API_KEY',
      'WEBHOOK_SIGNING_SECRET',
    ];

    for (const key of mandatoryKeys) {
      expect(prodKeys, `Production template missing mandatory key: ${key}`).toContain(key);
      expect(stagingKeys, `Staging template missing mandatory key: ${key}`).toContain(key);
    }
  });

  it('verifies production template configures Public network passphrase', () => {
    const prodContent = fs.readFileSync(path.resolve(process.cwd(), '.env.production.example'), 'utf8');
    expect(prodContent).toContain('Public Global Stellar Network ; September 2015');
    expect(prodContent).toContain('STELLAR_NETWORK=public');
  });

  it('verifies staging template configures Testnet network passphrase', () => {
    const stagingContent = fs.readFileSync(path.resolve(process.cwd(), '.env.staging.example'), 'utf8');
    expect(stagingContent).toContain('Test SDF Network ; September 2015');
    expect(stagingContent).toContain('STELLAR_NETWORK=testnet');
  });
});
