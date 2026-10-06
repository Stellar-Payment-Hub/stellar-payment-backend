# Architecture: Stellar Payment Backend

## Overview
This repository provides the backend service layer for the **Stellar Payment Hub**.

### Progression Across Levels

* **Level 1 (White Belt - Current)**:
  - Foundation API structure with TypeScript and Express.
  - Health check endpoint `GET /health` communicating service state and network configuration (`testnet`).
  - Strict error handling middleware.
  - Environment configuration foundation.
  - Unit/integration testing and GitHub Actions CI.

* **Level 2 (Yellow Belt - Planned)**:
  - Payment indexing service subscribing to Stellar Horizon / Soroban events.
  - Payment verification endpoint (checking tx hashes and ledger timestamps).
  - Webhook dispatcher for payment notifications.

* **Level 3 (Black Belt - Planned)**:
  - Real-time WebSocket connection for live payment tracker updates.
  - Split bill ledger calculations and multi-recipient batching.
  - Persistent database integration (PostgreSQL) for merchant history and tip records.

## Directory Structure
```text
stellar-payment-backend/
├── src/
│   ├── config/
│   │   └── env.ts           # Centralized environment variable loader
│   ├── middleware/
│   │   └── error.ts         # Centralized error handler
│   ├── routes/
│   │   └── health.ts        # GET /health endpoint
│   ├── app.ts               # Express application assembly
│   └── server.ts            # HTTP server startup
├── tests/
│   └── health.test.ts       # Supertest health checks
├── docs/
│   └── architecture.md      # Backend system design
├── .github/
│   └── workflows/
│       └── ci.yml           # Automated CI pipeline
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```
