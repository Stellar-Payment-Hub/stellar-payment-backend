import { describe, it, expect } from 'vitest';
import { MockFreighterWallet } from '../src/utils/mock-freighter';

describe('Mock Freighter Wallet Connector', () => {
  it('manages connection lifecycle and simulates user public key', async () => {
    const wallet = new MockFreighterWallet();
    expect(await wallet.isConnected()).toBe(false);

    const testKey = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    wallet.simulateConnect(testKey, 'TESTNET');

    expect(await wallet.isConnected()).toBe(true);
    expect(await wallet.getPublicKey()).toBe(testKey);
    expect(await wallet.getNetwork()).toBe('TESTNET');
  });

  it('signs transaction envelope when connected and rejects when disconnected', async () => {
    const wallet = new MockFreighterWallet();
    await expect(wallet.signTransaction('AAAAXDR')).rejects.toThrow('Cannot sign: wallet disconnected');

    wallet.simulateConnect('GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
    const signed = await wallet.signTransaction('AAAAXDR');
    expect(signed).toContain('AAAAXDR-SIGNED-BY-GBBD47IF');
  });
});
