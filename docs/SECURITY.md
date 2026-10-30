# Soroban Smart Contract Security & Threat Model

## Threat Analysis & Mitigations

### 1. Reentrancy & Cross-Contract Recursion
- **Threat**: Malicious recipient smart contract intercepts token transfer hook and re-invokes settlement method before state finalization.
- **Mitigation**: Stateful boolean reentrancy bitflag (`reentrancy_lock`). Any reentrant call terminates immediately with `ContractError(110): ReentrantCallDetected`.

### 2. Double-Spend & Transaction Replay
- **Threat**: Submitting an identical signed transaction envelope multiple times across ledgers.
- **Mitigation**: Unique `payment_id` indexing, cryptographically salted memo hashing, and sliding-window event deduplication cache in backend.

### 3. Integer Overflow and Rounding Truncation
- **Threat**: Accumulating rounding errors when splitting fractional amounts across numerous recipients.
- **Mitigation**: Pure integer mathematics using BigInt 64-bit and 128-bit Stroops. Remainder Stroops (`total % N`) are assigned to the primary recipient ensuring `Sum(Allocations) == TotalAmount` strictly.

### 4. Privilege Escalation & Unauthorized Pause
- **Threat**: Malicious actor invoking administrative pausing or fee configuration functions.
- **Mitigation**: Explicit `require_auth` assertions checking against stored Admin public key. Non-admins receive `ContractError(102): Unauthorized`.

### 5. Ledger Storage Expiration (TTL Denial of Service)
- **Threat**: State keys expiring and getting pruned from the ledger, rendering funds inaccessible.
- **Mitigation**: Automatic storage footprint inspection and programmatic TTL renewals (`extend_ttl`) for 200,000 ledgers.
