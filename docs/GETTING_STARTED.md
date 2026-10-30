# Developer Onboarding & Quickstart Guide

Welcome to the **Stellar Payment Hub** developer ecosystem!

## Prerequisites

- **Node.js**: v18.0.0 or higher (`node --version`)
- **Rust Toolchain**: 1.80+ with target `wasm32-unknown-unknown`
- **Freighter Wallet**: Browser extension installed with Testnet network enabled

## 5-Minute Quickstart

### 1. Clone the Monorepo / Workspaces
```bash
git clone https://github.com/Stellar-Payment-Hub/stellar-payment-backend.git
git clone https://github.com/Stellar-Payment-Hub/stellar-payment-contracts.git
git clone https://github.com/Stellar-Payment-Hub/stellar-payment-frontend.git
```

### 2. Run Backend Services
```bash
cd stellar-payment-backend
npm install
npm test
npm run dev
# Backend running at http://localhost:3000
```

### 3. Run Frontend Application
```bash
cd ../stellar-payment-frontend
npm install
npm test
npm run dev
# Web app running at http://localhost:5173
```

### 4. Build Smart Contracts
```bash
cd ../stellar-payment-contracts
cargo test
cargo build --target wasm32-unknown-unknown --release
```
