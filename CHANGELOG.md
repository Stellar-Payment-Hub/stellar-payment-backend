# Changelog

All notable changes to the Stellar Payment Hub Backend will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-10-30

### Added
- Integrated `@vitest/coverage-v8` test coverage engine with automated summary reporting.
- Conditional execution guards across CI/CD workflows preventing inapplicable steps.
- Expanded backend test suite to 41 test suites and 99 unit/integration tests with 100% pass rate.
- Health diagnostics endpoint `/api/health/diagnostics` exposing real-time SSE subscriber metrics and memory footprints.
- End-to-end user journey simulation tests verifying the complete Invoice -> Payment -> Multi-Split lifecycle.

## [1.0.0] - 2026-10-30

### Added
- **Smart Contracts**: Full Protocol 22 Soroban contracts for atomic settlements and escrows.
- **Atomic 100-Way Splits**: Zero-loss Stroop integer mathematics with remainder conservation.
- **Backend API**: 33 test suites covering payments, settlements, SSE push streams, and webhooks.
- **Frontend App**: Modern Vite + React UI with Freighter wallet integration and dev sandbox.
- **Testing & Quality Gates**: 100% test passing rate across Rust, Node.js, and React.
- **CI/CD Automation**: GitHub Actions workflows for format, clippy, vitest, and docker builds.
- **Security**: Reentrancy guards, rate limiting, HMAC-SHA256 webhooks, and emergency pause.
