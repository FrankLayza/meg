# Integration Guide

The contributor packages are independent. Integration uses stable JSON files, not imports into private folders.

## Assembly Order

1. Run Contributor 1 against a review fixture. Save its validated decision JSON.
2. Pass that JSON and escrow state to Contributor 2. Save its policy result JSON and transaction metadata.
3. Give Contributor 3 the review fixture, decision JSON, and policy result JSON. Render the full story.

Contributor 1 is independently complete. From `contributors/contributor-1-guardian`, install with `python -m pip install -e ".[test]"`, run `python -m pytest -q`, and use `scripts/deletion_test.py` to demonstrate the memory-dependent outcome change. The output decision is validated against `shared/contracts/decision.schema.json`.

Contributor 2 is independently complete. From the repository root, run `pnpm install`; then use `pnpm --dir contributors/contributor-2-escrow run compile:contract`, `pnpm --dir contributors/contributor-2-escrow test`, and `pnpm --dir contributors/contributor-2-escrow run build` (41 passing tests, offline). The release path consumes a decision JSON plus an escrow fixture and emits a `policy-result.schema.json`-valid result; `pnpm --dir contributors/contributor-2-escrow run demo` runs the approve path against the mock. A Base Sepolia release additionally needs a faucet-funded test wallet in `.env` (see `contributors/contributor-2-escrow/README.md`).

## File Boundaries

- Contributor 1 owns the `decision.schema.json` producer.
- Contributor 2 owns the `policy-result.schema.json` producer.
- Contributor 3 is a consumer of both schemas.
- Shared fixtures are examples only; each contributor may create local fixtures without changing another contributor's implementation.

The shared fixtures define the full integration story in order: `shared/fixtures/review-request-approved.json` -> `decision-approved.json` (produced by Contributor 1) -> `policy-result.schema.json` consumer output (produced by Contributor 2). `decision-revision.json` and `decision-escalate.json` exercise the non-release branches.

## Later Live Wiring

The future LLM provider replaces Contributor 1's deterministic reasoning function. The model must return the decision contract; Sibyl retrieval and decision validation remain application-owned. Contributor 2's deterministic policy remains the only path to a Base transaction.

The model insertion point is the `ReasoningProvider` protocol in `contributors/contributor-1-guardian/src/guardian_memory/reasoning.py`. An API-backed or SDK-backed provider can be passed to `Guardian(store, reasoner=provider)` without changing Sibyl retrieval or policy integration.
