# Hackathon Live Demo Walkthrough & Narrative Script

## Presentation Flow (5-Minute Video Pitch)

### 0:00 - 1:00: Problem Statement & Value Proposition
- Introduce the pain of batch disbursements on legacy networks (slow, high gas, rounding loss).
- Showcase Stellar Payment Hub's mission: Atomic multi-recipient settlements with sub-cent fees.

### 1:00 - 2:30: Multi-Wallet & Instant Split Bill Demo
- Connect Freighter wallet or use Preset Dev Account (Alice Merchant).
- Navigate to Split Bill / Payroll tab.
- Enter 100 XLM across 3 contributors: Watch the visual Remainder Allocation indicator assign 33.3333334 to the primary recipient and 33.3333333 to the rest.

### 2:30 - 3:30: Escrow & Arbitration Walkthrough
- Create a conditional timelocked escrow.
- Demonstrate raising a dispute with an evidence hash.
- Switch to Arbitrator role and adjudicate verdict: Watch escrowed funds immediately release.

### 3:30 - 4:30: SEP-0007 QR Codes & Real-Time Sync
- Generate instant `web+stellar:pay` invoice with dynamic SVG QR code.
- Simulate payment confirmation and watch the live pulsing SSE stream update account balances in real-time.

### 4:30 - 5:00: Conclusion & Architecture
- Highlight clean Protocol 22 Rust contracts, 300 atomic improvements, and 100% test coverage.
