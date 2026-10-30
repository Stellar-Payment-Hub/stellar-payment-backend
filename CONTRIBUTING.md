# Contributing to Stellar Payment Hub

Thank you for your interest in contributing to Stellar Payment Hub!

## Development Workflow

1. Fork the repository and create your feature branch: `git checkout -b feat/my-feature`.
2. Ensure all tests pass:
   - Backend: `npm test`
   - Contracts: `cargo test`
   - Frontend: `npm test`
3. Follow [Conventional Commits](https://www.conventionalcommits.org) format:
   - `feat(scope): add new capability`
   - `fix(scope): resolve bug`
   - `test(scope): add test coverage`
4. Push your changes and submit a Pull Request.

## Code Standards
- TypeScript: strict mode enabled (`noImplicitAny: true`).
- Rust: clippy with `-D warnings` clean.
