# Stellar Payment Hub — Backend & Event Synchronizer

[![Backend CI](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20%20%7C%20v22-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)

High-throughput, reliable backend synchronization layer and real-time event pipeline for the **Stellar Payment Hub**. Responsible for indexing on-chain Soroban contract events, managing multi-recipient settlements, servicing shareable invoice requests, and streaming real-time status updates via Server-Sent Events (SSE).

---

## Architectural Topology

```text
                        dApp Clients (React / Wallets)
                                     │
                                     ▼
                ┌────────────────────────────────────────┐
                │          Express API Gateway           │
                │   • Request Correlation Logger         │
                │   • IP In-Memory Rate Limiter          │
                └────────────────────┬───────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
[ Payments Router ]       [ Settlements Router ]     [ Invoices & Transactions ]
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                                     ▼
                ┌────────────────────────────────────────┐
                │        Repository & Domain Layer       │
                │  (PostgreSQL Model / In-Memory Store)  │
                └────────────────────┬───────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐
       │   Idempotency Engine      │   │   Server-Sent Events      │
       │ Deduplication by Event ID │   │ Real-Time Broadcast Hub   │
       └───────────────────────────┘   └───────────────────────────┘
```

---

## Key Capabilities

1. **Idempotent Soroban Event Processor**:
   Guarantees that duplicate ledger events or retried webhook calls do not cause duplicate state records. Deduplication uses unique event fingerprints (`{transaction_hash}-{ledger}-{topic}`).
2. **Multi-Recipient Settlement Aggregator**:
   Validates batch payment distributions, verifies that recipient shares sum precisely to the total settlement amount, and aggregates child payment lifecycle states.
3. **Shareable Invoice & Payment Request Engine**:
   Generates secure payment requests with configurable expiration timestamps, reference memos, and settlement confirmation hooks.
4. **Real-Time SSE Streaming**:
   Push-based communication (`/api/payments/stream`) broadcasting status updates (`payment:created`, `payment:updated`, `settlement:created`, `settlement:updated`) directly to connected frontend clients.
5. **Observability & Security**:
   Structured JSON-ready logging (`INFO`, `WARN`, `ERROR`), endpoint-level input validation, rate limiting, and zero exposure of wallet private keys or secrets.

---

## REST API Reference

### 1. Health & Network
* **`GET /health`**
  Returns service status, uptime, and active Stellar network configuration.

### 2. Multi-Address Settlements
* **`GET /api/settlements`**
  Query parameters: `payer`, `status`. Returns paginated settlement records.
* **`GET /api/settlements/:id`**
  Returns full settlement metadata, total amount, payer, status, and child recipient allocations.
* **`POST /api/settlements`**
  Creates a multi-address settlement. Validates that $\sum \text{recipients.amount} = \text{total\_amount}$.
* **`POST /api/settlements/:id/execute`**
  Finalizes settlement and records child payment references.
* **`POST /api/settlements/:id/cancel`**
  Cancels a pending settlement.

### 3. Tracked Payments
* **`GET /api/payments`**
  Query parameters: `status`, `creator`, `recipient`.
* **`GET /api/payments/:id`**
  Fetches payment details and complete audit event timeline.
* **`POST /api/payments`**
  Registers and indexes an on-chain payment.
* **`PATCH /api/payments/:id/status`**
  Updates status with state machine transition checks.
* **`GET /api/payments/:id/events`**
  Returns chronological lifecycle events.

### 4. Invoices & Payment Requests
* **`POST /api/payment-requests`**
  Creates a shareable invoice with requester address, amount, and reference memo.
* **`GET /api/payment-requests/:id`**
  Fetches request details and active/paid/expired status.
* **`PATCH /api/payment-requests/:id/pay`**
  Marks request as fulfilled with payer address and transaction hash.

### 5. Transaction Ledger & Real-Time Stream
* **`GET /api/transactions`**
  Returns indexed transaction history with explorer-verifiable hashes.
* **`POST /api/transactions`**
  Records on-chain confirmed transactions.
* **`GET /api/payments/stream`**
  Subscribes to live Server-Sent Events (SSE).

---

## Automated Test Suites

```bash
npm test
```

### Test Output

```text
 ✓ tests/health.test.ts (1 test)
 ✓ tests/transactions.test.ts (2 tests)
 ✓ tests/payment-requests.test.ts (3 tests)
 ✓ tests/settlements.test.ts (4 tests)
 ✓ tests/payments.test.ts (6 tests)

Test Files  5 passed (5)
     Tests  16 passed (16)
```

---

## Local Development & Setup

```bash
# 1. Clone repository
git clone https://github.com/Stellar-Payment-Hub/stellar-payment-backend.git
cd stellar-payment-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Run automated tests
npm test

# 5. Build TypeScript
npm run build

# 6. Start server
npm run dev
```

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP Server port | `3001` |
| `NODE_ENV` | Runtime environment | `development` |
| `STELLAR_NETWORK` | Stellar network target | `testnet` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/stellar_hub` |
| `PAYMENT_REGISTRY_CONTRACT` | Soroban Payment Registry ID | `CCBUEU4J4YXGSWURDMKUONPNGQ4ETBACWO5PC7IL5H4DVNYWJLYFETGY` |
| `SETTLEMENT_ROUTER_CONTRACT`| Soroban Settlement Router ID | `CBX7MKY4M2PQL5WR6B4GXZV8KTD2NQ3J9F1H5C7S0L8D4Y6A2V9W7U1E` |
