# Stellar Payment Hub - Backend & Orchestration API

[![Node Version](https://img.shields.io/badge/Node-18.x%20%7C%2020.x-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-41%20Suites%20Passing-brightgreen.svg)]()
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI-3.1%20Compliant-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

High-throughput orchestration layer connecting Stellar Horizon, Soroban RPC, and client interfaces with atomic transactions, Server-Sent Events (SSE), and enterprise webhook dispatch.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                        STELLAR PAYMENT HUB BACKEND                                |
+-----------------------------------------------------------------------------------+
|  [ Express API Gateway ]        [ Soroban RPC Client ]     [ Real-Time SSE Hub ]  |
|  - Rate Limiting & Auth         - Horizon & RPC Failover   - 1000+ Connections    |
|  - TraceContext Correlation     - Gas Simulation (Footprint) - Account Filtered   |
+---------------------------------+--------------------------+----------------------+
|  [ Split Settlement Engine ]    [ Webhook Dispatcher ]     [ Audit & Compliance ] |
|  - Zero-Loss BigInt Stroops     - HMAC-SHA256 Signatures   - SHA-256 Checksums    |
|  - Up to 100 Multi-Recipients   - Sliding-Window Dedupe    - CSV / JSON Reports   |
+---------------------------------+--------------------------+----------------------+
```

---

## Key Features

- **Stellar & Soroban RPC Client**: Auto-retrying HTTP client with exponential backoff and connection failover.
- **Real-Time Push Streams**: Low-overhead Server-Sent Events (SSE) multiplexing active client connections.
- **Zero-Loss Remainder Split Engine**: BigInt integer math distributing Stroops across 100+ recipients with zero loss.
- **Enterprise Webhook Dispatcher**: Cryptographically signed payloads (HMAC-SHA256) with sliding-window deduplication.
- **Compliance & Analytics**: Dynamic CSV / JSON export engines with verifiable SHA-256 integrity checksums.
- **Observability**: Prometheus metrics at `/metrics`, W3C TraceContext headers, and RFC 7807 problem details.

---

## API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service status, uptime, and network indicators |
| `GET` | `/api/health/diagnostics` | Heap memory, active SSE streams, and event queues |
| `POST` | `/api/payments` | Record and initiate on-chain Stellar payment |
| `GET` | `/api/payments/search` | Full-text payment search with cursor pagination |
| `POST` | `/api/settlements` | Multi-recipient split bill & payroll settlement |
| `POST` | `/api/settlements/calculate-split` | Zero-loss Stroop remainder calculation |
| `POST` | `/api/stellar/simulate` | Soroban transaction CPU and memory gas simulation |
| `GET` | `/api/events/stream` | Real-time SSE push stream with `account` filter |
| `POST` | `/api/webhooks` | Register HMAC-SHA256 signed event webhook |
| `GET` | `/api/reports/payments.csv` | Export payment ledger to verified CSV format |
| `GET` | `/api-docs.json` | OpenAPI 3.1 schema specification |

---

## Running the Backend

```bash
# Install dependencies
npm ci

# Run test suite (41 files, 99 tests)
npm test

# Run tests with code coverage report
npm test -- --coverage

# Build TypeScript production distribution
npm run build

# Start server
npm start
```

---

## Community & Security
- **License**: [MIT License](LICENSE) - Copyright (c) 2026 omolobamoyinoluwa-max
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- **Security Policy**: [SECURITY.md](SECURITY.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
