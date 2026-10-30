# System Architecture Specification

## Overview

The **Stellar Payment Hub** is an end-to-end decentralized financial infrastructure platform engineered on Stellar and Soroban. It bridges institutional payment requirements (atomic split disbursements, conditional escrows, dispute resolution) with sub-second settlement and sub-cent fees.

## Architectural Layers

```
+-------------------------------------------------------------+
|                      Client Layer                           |
|  - React 18 Web App (Vite + Tailwind)                      |
|  - Freighter Wallet & Dev Keypair Sandbox                   |
|  - SEP-0007 QR Code & Deep-Link Consumer                   |
+-------------------------------------------------------------+
                              |
                              v (HTTPS / SSE / REST)
+-------------------------------------------------------------+
|                      Orchestration Layer                    |
|  - Express / TypeScript Backend                             |
|  - SSE Event Broadcaster & Webhook Dispatcher               |
|  - BigInt Zero-Loss Remainder Split Engine                  |
|  - StrKey & XDR Verification Layer                          |
+-------------------------------------------------------------+
                              |
                              v (JSON-RPC 2.0 / Horizon REST)
+-------------------------------------------------------------+
|                      Blockchain Layer                       |
|  - Soroban Virtual Machine (Protocol 22)                    |
|  - payment-registry Contract (Escrows, RBAC, Audits)        |
|  - settlement-router Contract (Atomic 100-Way Splits)       |
|  - Stellar Asset Contracts (Native XLM, USDC, EURC)         |
+-------------------------------------------------------------+
```

## Core Principles

1. **Atomic Invariance**: All multi-recipient transfers either fully commit or fully revert on-chain.
2. **Integer Stroop Accounting**: Never use floating-point mathematics for money; 1 XLM = 10,000,000 Stroops.
3. **Reactive State Sync**: Clients receive instant push notifications via Server-Sent Events (SSE) upon transaction confirmation.
4. **Defense in Depth**: Reentrancy guards, rate limiting, HMAC webhooks, and administrative multi-sig pausing.
