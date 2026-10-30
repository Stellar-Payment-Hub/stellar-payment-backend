import { Router, Request, Response } from 'express';

export interface SupportedAsset {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  type: 'native' | 'soroban_sac' | 'custom_token';
  contractId?: string;
  issuer?: string;
  faucetUrl?: string;
}

export const SUPPORTED_ASSETS: SupportedAsset[] = [
  {
    code: 'XLM',
    name: 'Stellar Lumens',
    symbol: 'XLM',
    decimals: 7,
    type: 'native',
    faucetUrl: 'https://friendbot.stellar.org',
  },
  {
    code: 'USDC',
    name: 'USD Coin (Testnet)',
    symbol: 'USDC',
    decimals: 7,
    type: 'soroban_sac',
    contractId: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWUOT3ARSTAWZX6W2Y7',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
  {
    code: 'EURC',
    name: 'Euro Coin (Testnet)',
    symbol: 'EURC',
    decimals: 7,
    type: 'soroban_sac',
    contractId: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUW27CW4FUSODWOC2PAA3N5',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  },
];

export const assetsRouter = Router();

assetsRouter.get('/api/assets', (_req: Request, res: Response) => {
  return res.json({
    network: 'testnet',
    count: SUPPORTED_ASSETS.length,
    assets: SUPPORTED_ASSETS,
  });
});
