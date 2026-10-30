export interface TestAccountProfile {
  name: string;
  publicKey: string;
  role: string;
}

export const DETERMINISTIC_TEST_ACCOUNTS: Record<string, TestAccountProfile> = {
  ALICE: {
    name: 'Alice (Merchant)',
    publicKey: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    role: 'Admin',
  },
  BOB: {
    name: 'Bob (Recipient)',
    publicKey: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    role: 'SettlementOperator',
  },
  CHARLIE: {
    name: 'Charlie (Arbitrator)',
    publicKey: 'GCF3G23D7TY42E4P42UQLU7PGLZ2F4532B4YJDF5GBX24S34MMP54H2G',
    role: 'Arbitrator',
  },
};

export function getTestAccount(name: keyof typeof DETERMINISTIC_TEST_ACCOUNTS): TestAccountProfile {
  return DETERMINISTIC_TEST_ACCOUNTS[name];
}
