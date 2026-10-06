# Stellar Payment Hub - Backend

[![Backend CI](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Payment-Hub/stellar-payment-backend/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar Network](https://img.shields.io/badge/Stellar-Testnet-blueviolet)](https://stellar.org)

Backend service foundation for **Stellar Payment Hub**.

---

## Level 1: White Belt Status

In **Level 1**, this repository establishes the core backend foundation:
* **Service Health API**: `GET /health` with service status and network state (`testnet`).
* **Clean Layered Architecture**: Structured routes, middleware, and type-safe environment configuration.
* **Testing & CI**: Unit test suite with Supertest and automated GitHub Actions verification.

In later levels, this repository will evolve into the real-time payment tracker, ledger indexing engine, and payment notification webhook service.

---

## Architecture Overview

```text
stellar-payment-backend/
├── src/
│   ├── config/
│   │   └── env.ts           # Type-safe environment variable management
│   ├── middleware/
│   │   └── error.ts         # Centralized error handler
│   ├── routes/
│   │   └── health.ts        # GET /health route
│   ├── app.ts               # Express application
│   └── server.ts            # Entrypoint
├── tests/
│   └── health.test.ts       # Health endpoint test
├── docs/
│   └── architecture.md      # Backend evolution doc
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## API Endpoints (Level 1)

### `GET /health`
Returns the operational health of the backend and active Stellar network.

**Response**:
```json
{
  "status": "ok",
  "service": "stellar-payment-backend",
  "network": "testnet"
}
```

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:4000`.

### 4. Run Tests
```bash
npm test
```

### 5. Build for Production
```bash
npm run build
npm start
```

---

## Roadmap

* **Level 1 (Foundation)**: Health API, environment config, error middleware, CI pipeline.
* **Level 2 (Yellow Belt)**: Payment indexing, transaction hash verification, webhook alerts.
* **Level 3 (Black Belt)**: Real-time WebSocket subscriptions, split payment calculations, transaction audit database.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
