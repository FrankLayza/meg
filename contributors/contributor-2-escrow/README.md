# Contributor 2: Escrow and Safety

Deterministic policy gate + Base Sepolia escrow release. Consumes Contributor 1's decision JSON via `shared/contracts/decision.schema.json`; emits a `policy-result.schema.json`-valid result and an audit action record. No Sibyl runtime, no LLM.

> Safety invariant: model output never moves funds. Release requires validate -> chain facts -> policy -> human confirmation -> simulate -> send, and every failure closes to `hold` or `escalate`.

## Layout

- `contracts/MilestoneEscrow.sol` - minimal guardian-controlled native-ETH escrow (one struct per milestone key, `release`/`refund`/`fund`/`setDispute`/`setFreelancer`).
- `scripts/compile-contract.ts` - compiles with the `solc` npm package and emits `dist/contracts/MilestoneEscrow.json` + `src/escrow-abi.gen.ts`.
- `src/policy.ts` - deterministic gates: approve-only, already-released, unfunded, dispute, evidence, on-chain amount cap, allowlist, confirmation.
- `src/validation.ts` - Ajv (draft 2020-12) validation of decision input and policy-result output against the shared schemas. Fail closed.
- `src/escrow.ts` - `EscrowClient` boundary, `withReadRetries` (reads only, never sends), `MockEscrowClient` for offline tests.
- `src/base-escrow.ts` - viem `BaseEscrowClient`: reads chain facts (including real escrow `amount`), simulates before every send, nonce-guarded writes, receipt status checks; plus `fund`/`setFreelancer`/`setDispute` admin helpers.
- `src/release.ts` - `runRelease` orchestrator wiring validation -> chain read -> policy -> simulate -> release, producing the action record.
- `src/cli.ts` - `escrow-release` CLI.

## Verify (offline)

```bash
pnpm install
pnpm run compile:contract
pnpm test        # 41 tests
pnpm run build   # tsc -p tsconfig.json
pnpm run demo    # approve path vs MockEscrowClient (dry-run)
```

All three decision outcomes are covered by fixtures and fail-closed paths:

```bash
# approve -> release (mock receipt), request_revision -> hold, escalate -> hold
tsx src/cli.ts --dry-run --local --yes --allowlist 0x1111111111111111111111111111111111111111 --decision ..\..\shared\fixtures\decision-approved.json --escrow fixtures\escrow-state.example.json
```

## Release on Base Sepolia

1. Copy `.env.example` to `.env`; fund the test wallet via a Base Sepolia faucet.
2. Deploy: `pnpm run escrow:deploy` -> put the printed address in `.env` (`ESCROW_CONTRACT_ADDRESS` and `ESCROW_ALLOWLIST`).
3. Fund: `pnpm run escrow:fund -- --milestone milestone-001 --amount 100000000000000000 --freelancer 0x...` (then read the state with `--local` off).
4. Release: `pnpm run escrow:release` (or `tsx src/cli.ts --decision <decision.json> --escrow fixtures\escrow-state.example.json`). It prompts `[y/N]` unless `--yes`; never runs on untested amounts.

Recorded tx hashes are on Basescan: `https://sepolia.basescan.org/tx/<hash>`.

## Security

See `docs/threat-model.md`. Key points: fail-closed on every chain/validation error, on-chain facts override caller claims, real on-chain `amount` is capped and logged, sends are never blind-retried, secrets live only in git-ignored `.env`.

## Interface

- Input: decision JSON (`shared/contracts/decision.schema.json`), escrow fixture `{ milestoneId, contract_address, amount, evidencePresent }`. The contract must be explicitly allowlisted; an absent allowlist denies release.
- Output: `policyResult` (schema-validated against `policy-result.schema.json`) + `escrowAction` audit record.
- Independent of Contributor 1's runtime; consumes only the frozen JSON contract.
