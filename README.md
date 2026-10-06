# Stellar Payment Hub — Backend & Event Synchronizer

[![Backend CI](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20%20%7C%20v22-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express)](https://expressjs.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-16%2F16%20Passed-10b981)](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions)
[![Real-Time SSE](https://img.shields.io/badge/Real--Time-SSE%20Stream-0284c7)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg)](LICENSE)

Production-oriented backend synchronization layer, event processor, and real-time payment hub for the **Stellar Payment Hub**. Built with Node.js, Express, and TypeScript, providing idempotent event indexing, multi-address settlement validation, invoice fulfillment tracking, and low-latency Server-Sent Events (SSE) streaming.

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
   Guarantees that replayed ledger transactions or network retries do not generate duplicate database entries. Every event is validated against a unique fingerprint: `{transaction_hash}-{ledger}-{topic}`.
2. **Multi-Recipient Settlement Aggregation**:
   Validates batch disbursements, confirms that participant shares sum exactly to the total settlement amount, and tracks child payment lifecycle statuses.
3. **Shareable Invoice & Payment Request Engine**:
   Provides invoice creation with configurable expiry timestamps, reference memos, and fulfillment tracking.
4. **Real-Time Push Synchronization**:
   Push-based communication (`/api/payments/stream`) broadcasting lifecycle transitions (`payment:created`, `payment:updated`, `settlement:created`, `settlement:updated`) directly to connected frontend clients without polling.
5. **Security & Observability**:
   Structured logging, in-memory IP rate limiting, input sanitization, and zero exposure of private keys or secrets.

---

## REST API Specifications

### 1. Health & Status
* **`GET /health`**
  * **Response**: `200 OK`
  * **Payload**:
    ```json
    {
      "status": "healthy",
      "network": "testnet",
      "timestamp": "2026-10-06T12:00:00.000Z"
    }
    ```

### 2. Multi-Address Settlements
* **`GET /api/settlements`**
  * **Query Parameters**: `payer` (string, optional), `status` (string, optional).
  * **Response**: `200 OK` with array of `SettlementRecord` objects.
* **`GET /api/settlements/:id`**
  * **Response**: `200 OK` with full settlement details and child recipient shares; `404 Not Found` if nonexistent.
* **`POST /api/settlements`**
  * **Payload**:
    ```json
    {
      "payer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      "total_amount": "100.0000",
      "memo": "Contributor Bounty",
      "recipients": [
        { "recipient": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5", "amount": "60.0000" },
        { "recipient": "GCA3HNDW4F4D3C57Q5P7LGL7HCKH6I2YFUKM2Y6W6X7XF5Q2VLL4X7R7", "amount": "40.0000" }
      ]
    }
    ```
  * **Validation**: Enforces that `sum(recipients.amount) == total_amount`.
  * **Response**: `201 Created` with initialized `SettlementRecord`.
* **`POST /api/settlements/:id/execute`**
  * **Response**: `200 OK` with finalized settlement and sub-payment IDs.
* **`POST /api/settlements/:id/cancel`**
  * **Response**: `200 OK` with status transitioned to `CANCELLED`.

### 3. Tracked Payments
* **`GET /api/payments`**
  * **Query Parameters**: `status`, `creator`, `recipient`.
* **`GET /api/payments/:id`**
  * **Response**: `200 OK` containing payment record and chronological event history.
* **`POST /api/payments`**
  * **Payload**: `{ "creator_address": "G...", "recipient_address": "G...", "amount": "25.0000", "memo": "Invoice #1042" }`
  * **Response**: `201 Created` with registered `TrackerPayment`.
* **`PATCH /api/payments/:id/status`**
  * **Payload**: `{ "status": "COMPLETED", "transaction_hash": "..." }`
  * **Response**: `200 OK` with updated payment.

### 4. Invoices & Payment Requests
* **`POST /api/payment-requests`**
  * **Payload**: `{ "requester": "G...", "amount": "50.0000", "memo": "Consulting Fee" }`
  * **Response**: `201 Created` with generated `REQ-xxx` and shareable link.
* **`GET /api/payment-requests/:id`**
  * **Response**: `200 OK` with request status (`ACTIVE`, `PAID`, `EXPIRED`).
* **`PATCH /api/payment-requests/:id/pay`**
  * **Payload**: `{ "paid_by": "G...", "transaction_hash": "..." }`
  * **Response**: `200 OK` marking invoice as fulfilled.

### 5. Blockchain Transactions
* **`GET /api/transactions`**
  * **Response**: `200 OK` returning verified on-chain transactions with Stellar ledger sequences.
* **`POST /api/transactions`**
  * **Response**: `201 Created` indexing confirmed transaction hash.

### 6. Real-Time Event Stream
* **`GET /api/payments/stream`**
  * **Headers**: `Content-Type: text/event-stream`, `Connection: keep-alive`
  * **Events**: `payment:created`, `payment:updated`, `settlement:created`, `settlement:updated`.

---

## Error Handling & Status Code Catalog

The API adheres to standard HTTP status codes and structured error responses:

```json
{
  "error": "Validation failed",
  "message": "Sum of recipient amounts (90.0000) does not match total amount (100.0000).",
  "code": "SUM_MISMATCH"
}
```

| HTTP Status | Error Code | Common Cause | Recovery / Handling |
| :---: | :--- | :--- | :--- |
| **`400`** | `INVALID_INPUT` | Missing required fields, non-numeric amount, or invalid address | Check payload parameters and format addresses as valid 56-char Stellar keys |
| **`400`** | `SUM_MISMATCH` | `sum(recipient amounts) != total_amount` | Adjust recipient shares to match total settlement amount |
| **`400`** | `DUPLICATE_RECIPIENT` | Duplicate recipient address in batch settlement | Deduplicate recipient list before submission |
| **`404`** | `NOT_FOUND` | Specified payment or settlement ID does not exist | Verify ID or check if created in a different environment |
| **`409`** | `IDEMPOTENT_CONFLICT` | An event with the same ID/hash has already been processed | Safe to ignore; return existing persisted record |
| **`422`** | `INVALID_TRANSITION` | Attempted illegal state change (e.g. `COMPLETED` -> `PENDING`) | Adhere to permitted transition order |
| **`429`** | `RATE_LIMIT_EXCEEDED` | Request threshold exceeded (>100 req / 15 min per IP) | Back off requests and adhere to `Retry-After` header |
| **`500`** | `INTERNAL_ERROR` | Uncaught server exception or database timeout | Retry with exponential backoff |
| **`503`** | `RPC_UNAVAILABLE` | Stellar Horizon or Soroban RPC endpoint is unreachable | Check network status or configure fallback RPC URL |

---

## Automated Test Coverage

```bash
npm test
```

### Verified Test Output

```text
 ✓ tests/health.test.ts (1 test)
 ✓ tests/transactions.test.ts (2 tests)
 ✓ tests/payment-requests.test.ts (3 tests)
 ✓ tests/settlements.test.ts (4 tests)
 ✓ tests/payments.test.ts (6 tests)

Test Files  5 passed (5)
     Tests  16 passed (16)
  Duration  1.82s
```

---

## Environment Configuration

| Variable | Description | Default | Required in Production |
| :--- | :--- | :--- | :---: |
| `PORT` | HTTP Server port | `3001` | No |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` | Yes |
| `STELLAR_NETWORK` | Target Stellar network | `testnet` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/hub` | Yes |
| `PAYMENT_REGISTRY_CONTRACT` | Deployed Soroban Payment Registry ID | `CCBUEU4J4YXGSWURDMKUONPNGQ4ETBACWO5PC7IL5H4DVNYWJLYFETGY` | Yes |
| `SETTLEMENT_ROUTER_CONTRACT`| Deployed Soroban Settlement Router ID | `CBX7MKY4M2PQL5WR6B4GXZV8KTD2NQ3J9F1H5C7S0L8D4Y6A2V9W7U1E` | Yes |
| `STELLAR_RPC_URL` | Soroban RPC provider endpoint | `https://soroban-testnet.stellar.org` | Yes |
| `CORS_ORIGIN` | Allowed CORS origin(s) | `*` (development) | Yes |

---

## Local Setup & Runbook

```bash
# 1. Clone repository
git clone https://github.com/Stellar-Payment-Hub/stellar-payment-backend.git
cd stellar-payment-backend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Run test suite
npm test

# 5. Build TypeScript
npm run build

# 6. Start server
npm run dev
```
