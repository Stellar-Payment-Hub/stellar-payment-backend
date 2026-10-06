# Stellar Payment Hub - Backend (Level 2: Yellow Belt)

[![Backend CI](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-blueviolet)](https://stellar.org)

Backend service foundation and real-time payment synchronization layer for **Stellar Payment Hub**.

---

## Level 2: Yellow Belt Capabilities

In **Level 2**, this backend acts as the synchronization and indexing hub:
* **Payment Indexing API**: CRUD management of on-chain and off-chain payment records.
* **Idempotent Event Processing**: Deduplication engine preventing duplicate ledger event writes.
* **Real-time Event Stream (SSE)**: Server-Sent Events stream (`GET /api/payments/stream`) pushing live status updates to frontend clients.
* **Audit Trail**: Tracking lifecycle events for every payment (`PaymentCreated`, `PaymentUpdated`, `PaymentCompleted`, `PaymentCancelled`).

---

## API Endpoints

### 1. Health & Status
* `GET /health` &mdash; Returns service health and active Stellar network (`testnet`).

### 2. Payments
* `GET /api/payments` &mdash; List payments.
  * Query parameters: `status`, `creator`, `recipient`
* `GET /api/payments/:id` &mdash; Retrieve single payment details and audit events.
* `POST /api/payments` &mdash; Register/Index a new payment.
* `PATCH /api/payments/:id/status` &mdash; Update payment status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`).
* `GET /api/payments/:id/events` &mdash; Retrieve event history for a specific payment.

### 3. Events & Real-time Synchronization
* `POST /api/events/process` &mdash; Ingest and process a contract event with idempotency.
* `GET /api/payments/stream` &mdash; Server-Sent Events (SSE) stream for real-time frontend updates.

---

## Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Run development server
npm run dev

# Run automated tests
npm test

# Build for production
npm run build
npm start
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
