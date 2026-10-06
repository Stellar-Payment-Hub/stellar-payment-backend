# Stellar Payment Hub - Backend (Level 3: Orange Belt)

[![Backend CI](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-blueviolet)](https://stellar.org)

Production-oriented backend synchronization layer and real-time payment hub for **Stellar Payment Hub**.

---

## Level 3: Orange Belt Architecture

In **Level 3**, the backend provides a layered architecture supporting individual and grouped payments:
* **Multi-Recipient Settlement API**: Creation, tracking, and execution of multi-address settlements.
* **Payment Requests Engine**: Creation and fulfillment tracking of shareable invoice links.
* **Blockchain Transaction Ledger**: Indexing of confirmed native XLM, contract, and settlement transactions.
* **Idempotent Event Processing Pipeline**: Deduplication across blockchain ledger sequences.
* **Real-time SSE Hub**: Broadcasting real-time status changes for payments, settlements, and payment requests.
* **Production Middleware**: Structured logging (`[INFO]`, `[WARN]`, `[ERROR]`), IP-based rate limiting, and centralized error handling.

---

## Layered Architecture Diagram

```text
                        HTTP Clients (dApp / Web3)
                                    │
                                    ▼
                +---------------------------------------+
                |         Express API Gateway           |
                |  (Request Logger + Rate Limiter)      |
                +-------------------+-------------------+
                                    │
        +---------------------------+---------------------------+
        │                           │                           │
        ▼                           ▼                           ▼
[ Payments Router ]       [ Settlements Router ]     [ Requests & Transactions ]
        │                           │                           │
        +---------------------------+---------------------------+
                                    │
                                    ▼
                +---------------------------------------+
                |        Repository & State Layer       |
                |  (Payments, Settlements, Ledger Index)|
                +-------------------+-------------------+
                                    │
                    +---------------+---------------+
                    │                               │
                    ▼                               ▼
       [ Idempotent Deduplication ]      [ Server-Sent Events (SSE) ]
```

---

## API Endpoints

### 1. Health & Status
* `GET /health` &mdash; Returns service health and active Stellar network (`testnet`).

### 2. Payments (Level 2 & 3)
* `GET /api/payments` &mdash; List payments with query filters (`status`, `creator`, `recipient`).
* `GET /api/payments/:id` &mdash; Retrieve single payment details and audit events.
* `POST /api/payments` &mdash; Register/Index a payment.
* `PATCH /api/payments/:id/status` &mdash; Update payment status.
* `GET /api/payments/:id/events` &mdash; Retrieve event audit log.

### 3. Settlements (Level 3 Multi-Address)
* `GET /api/settlements` &mdash; List settlements with filters (`payer`, `status`).
* `GET /api/settlements/:id` &mdash; Retrieve multi-recipient settlement details and child shares.
* `POST /api/settlements` &mdash; Create a new multi-address settlement request (validates exact share sum).
* `POST /api/settlements/:id/execute` &mdash; Complete settlement and record child payment IDs.
* `POST /api/settlements/:id/cancel` &mdash; Cancel pending settlement.

### 4. Payment Requests & Invoices
* `POST /api/payment-requests` &mdash; Create a shareable payment request.
* `GET /api/payment-requests/:id` &mdash; Retrieve request details.
* `PATCH /api/payment-requests/:id/pay` &mdash; Record fulfillment with transaction hash.

### 5. Blockchain Transactions
* `GET /api/transactions` &mdash; List transaction history ledger.
* `POST /api/transactions` &mdash; Record confirmed blockchain transaction.

### 6. Events & Real-time Stream
* `POST /api/events/process` &mdash; Idempotently process on-chain contract events.
* `GET /api/payments/stream` &mdash; Real-time Server-Sent Events (SSE) stream.

---

## Automated Test Coverage

```bash
npm test
```

```text
 ✓ tests/health.test.ts (1 test)
 ✓ tests/transactions.test.ts (2 tests)
 ✓ tests/payment-requests.test.ts (3 tests)
 ✓ tests/settlements.test.ts (4 tests)
 ✓ tests/payments.test.ts (6 tests)

 Test Files  5 passed (5)
      Tests  16 passed (16)
```
