export interface PlatformAsset {
  code: string;
  name: string;
  issuer?: string;
  decimals: number;
  testnetContractId?: string;
  mainnetContractId?: string;
}

export const ASSET_CATALOG: Record<string, PlatformAsset> = {
  XLM: {
    code: 'XLM',
    name: 'Stellar Lumens',
    decimals: 7,
    testnetContractId: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  },
  USDC: {
    code: 'USDC',
    name: 'USD Coin',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    decimals: 7,
    testnetContractId: 'CBIELTK6YBZJU5UP2WWQEUCYJLPU6QXNGBUVMNCQZ53I2CS7WMB4K7J3',
  },
  EURC: {
    code: 'EURC',
    name: 'Euro Coin',
    issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    decimals: 7,
    testnetContractId: 'CCVK2S3527D6J7M2X3Y7JGLB2Q2K3Z4N5M6O7P8Q9R0S1T2U3V4W5X6Y',
  },
};

export function isValidAssetCode(code: string): boolean {
  return Boolean(ASSET_CATALOG[code.toUpperCase()]);
}

export function getAssetDecimals(code: string): number {
  return ASSET_CATALOG[code.toUpperCase()]?.decimals ?? 7;
}
