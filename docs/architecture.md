# Architecture: Stellar Payment Backend & Event Synchronizer

## Overview
This repository provides the backend API gateway, idempotent Soroban blockchain event synchronizer, and real-time push streaming layer for the **Stellar Payment Hub**.

The service provides:
1. **Idempotent Blockchain Event Ingestion**: Prevents duplicate records across ledger reorgs or RPC retries by fingerprinting events with `{transaction_hash}-{ledger}-{topic}`.
2. **Multi-Recipient Settlement Validation**: Validates batch disbursement calculations and tracks nested child payment statuses.
3. **Invoicing & Payment Request Management**: Manages shareable payment requests, expiration schedules, and payment verification.
4. **Real-Time Push Streaming**: Leverages Server-Sent Events (SSE) via `/api/payments/stream` to push state transitions instantly to connected frontend clients.

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

## Directory Structure
```text
stellar-payment-backend/
├── src/
│   ├── config/
│   │   └── env.ts               # Centralized environment variable loader
│   ├── database/
│   │   └── repository.ts        # Payment, settlement, and transaction models
│   ├── events/
│   │   └── processor.ts         # Idempotent event fingerprint processor
│   ├── middleware/
│   │   ├── error.ts             # Centralized error handler
│   │   ├── logger.ts            # Correlation request logger
│   │   └── rate-limit.ts        # IP token bucket rate limiter
│   ├── realtime/
│   │   └── sse.ts               # Server-Sent Events broadcast manager
│   ├── routes/
│   │   ├── health.ts            # GET /health probe
│   │   ├── payment-requests.ts  # Invoices & payment request routes
│   │   ├── payments.ts          # Core payments & SSE stream route
│   │   ├── settlements.ts       # Multi-address batch settlements
│   │   └── transactions.ts      # Indexed ledger transactions
│   ├── app.ts                   # Express application assembly
│   └── server.ts                # HTTP server bootstrap
├── tests/
│   ├── health.test.ts
│   ├── payment-requests.test.ts
│   ├── payments.test.ts
│   ├── settlements.test.ts
│   └── transactions.test.ts
├── docs/
│   └── architecture.md
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Error & Security Standards
* **Rate Limiting**: Bounded at 100 requests per 15 minutes per IP address on public endpoints.
* **Input Validation**: Strict address validation using StrKey Ed25519 checksums.
* **Deterministic Accounting**: Financial amounts are validated to prevent negative values, self-payments, and split discrepancies.
