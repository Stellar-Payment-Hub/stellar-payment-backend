import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  port: number;
  nodeEnv: string;
  stellarNetwork: string;
  stellarHorizonUrl: string;
  stellarRpcUrl: string;
  stellarNetworkPassphrase: string;
}

export const env: EnvConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  stellarNetwork: process.env.STELLAR_NETWORK || 'testnet',
  stellarHorizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  stellarRpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
  stellarNetworkPassphrase:
    process.env.STELLAR_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
};
