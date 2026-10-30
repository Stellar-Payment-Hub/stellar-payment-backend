# Stellar Ecosystem Standards (SEP) Alignment

The **Stellar Payment Hub** adheres strictly to official Stellar Ecosystem Proposals (SEPs):

## 1. SEP-0007: URI Scheme for Delegated Signing
- URI format: `web+stellar:pay?destination=G...&amount=...&memo=...&asset_code=...`
- Enables one-click payment execution from web pages directly to mobile and desktop wallets (e.g. Lobstr, Freighter).
- Supported by the backend endpoint `/api/stellar/sep0007-uri` and QR code rendering engine.

## 2. SEP-0024: Hosted Deposit & Withdrawal
- Standard interface for on/off-ramp anchors.
- Prepares the platform for direct fiat on-ramping (USD/EUR bank deposits converting into Stellar USDC/EURC).

## 3. SEP-0001: stellar.toml Metadata
- Domain verification associating the Stellar Payment Hub web domain with public smart contract addresses.
