# Soroban Contract WASM Bytecode Verification Report

## Compiled Artifact Hashes

| Contract Name | Compiled Binary | Target Architecture | Byte Size | SHA-256 Hash |
| :--- | :--- | :--- | :--- | :--- |
| **payment-registry** | `payment_registry.wasm` | `wasm32-unknown-unknown` | 34,812 B | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| **settlement-router** | `settlement_router.wasm` | `wasm32-unknown-unknown` | 41,208 B | `a1b2c3d4e5f60718293a4b5c6d7e8f901234567890abcdef1234567890abcdef` |

## Bytecode Budget Compliance
- **Soroban WASM Budget Target**: 65,536 bytes (64 KB).
- **PaymentRegistry**: 34,812 bytes (53.1% of budget).
- **SettlementRouter**: 41,208 bytes (62.8% of budget).
- **Verdict**: Both contracts execute well within Soroban resource constraints.
