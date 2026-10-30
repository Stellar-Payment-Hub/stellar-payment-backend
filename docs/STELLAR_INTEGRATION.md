# Stellar Horizon & Soroban RPC Integration Guide

## Connecting to Stellar Infrastructure

The platform connects to two complementary Stellar network interfaces:

### 1. Horizon REST API (`https://horizon-testnet.stellar.org`)
- **Account Balances**: Retrieves native XLM and token trustlines via `/accounts/{address}`.
- **Fee Statistics**: Queries `/fee_stats` to obtain dynamic network surge fee recommendations.
- **Ledger Ingestion**: Subscribes to transaction streams for finalized ledger commits.

### 2. Soroban RPC (`https://soroban-testnet.stellar.org`)
- **JSON-RPC 2.0**: Protocol compliant RPC communication.
- **Method `simulateTransaction`**: Simulates contract execution without spending gas, returning CPU instructions, memory bytes, and ledger resource footprints.
- **Method `sendTransaction`**: Submits signed transaction envelopes directly to the validator network.
- **Method `getTransaction`**: Polls transaction status until inclusion in a confirmed ledger.
- **Method `getEvents`**: Ingests smart contract diagnostic topics using start ledger cursors.

## Network Passphrases

- **Stellar Public Mainnet**: `Public Global Stellar Network ; September 2015`
- **Stellar Testnet**: `Test SDF Network ; September 2015`
- **Stellar Futurenet**: `Test SDF Future Network ; October 2022`
