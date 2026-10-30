/**
 * Mock Freighter Wallet Extension Harness
 * Simulates browser window.freighter API for automated headless testing.
 */

export interface MockFreighterState {
  connected: boolean;
  publicKey: string | null;
  network: string;
}

export class MockFreighterWallet {
  private state: MockFreighterState = {
    connected: false,
    publicKey: null,
    network: 'TESTNET',
  };

  public async isConnected(): Promise<boolean> {
    return this.state.connected;
  }

  public async getPublicKey(): Promise<string> {
    if (!this.state.connected || !this.state.publicKey) {
      throw new Error('Freighter wallet not connected');
    }
    return this.state.publicKey;
  }

  public async getNetwork(): Promise<string> {
    return this.state.network;
  }

  public async signTransaction(xdr: string): Promise<string> {
    if (!this.state.connected) {
      throw new Error('Cannot sign: wallet disconnected');
    }
    // Return dummy signed XDR envelope
    return `${xdr}-SIGNED-BY-${this.state.publicKey?.substring(0, 8)}`;
  }

  public simulateConnect(publicKey: string, network: string = 'TESTNET') {
    this.state.connected = true;
    this.state.publicKey = publicKey;
    this.state.network = network;
  }

  public simulateDisconnect() {
    this.state.connected = false;
    this.state.publicKey = null;
  }
}
