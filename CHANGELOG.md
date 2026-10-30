# Changelog

All notable changes to the Stellar Payment Hub will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-30

### Added
- **Smart Contracts**: Full Protocol 22 Soroban contracts for atomic settlements and escrows.
- **Atomic 100-Way Splits**: Zero-loss Stroop integer mathematics with remainder conservation.
- **Backend API**: 33 test suites covering payments, settlements, SSE push streams, and webhooks.
- **Frontend App**: Modern Vite + React UI with Freighter wallet integration and dev sandbox.
- **Testing & Quality Gates**: 100% test passing rate across Rust, Node.js, and React.
- **CI/CD Automation**: GitHub Actions workflows for format, clippy, vitest, and docker builds.
- **Security**: Reentrancy guards, rate limiting, HMAC-SHA256 webhooks, and emergency pause.
