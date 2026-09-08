# Escrow Release Threat Model

Scope: the Contributor 2 release path as it exists in this repository. The media guard for the whole product is `docs/PROJECT_CONTEXT.md`; this document covers adversarial cases local to escrow movement.

## Trust boundary

- **Untrusted**: Guardian model output, decision JSON on disk, the RPC endpoint, anyone who can write files to the machine running the CLI.
- **Semi-trusted**: the operator who deploys/funds the contract and answers the confirmation prompt.
- **Trusted**: Base Sepolia execution and the deployed `MilestoneEscrow` bytecode.
- **Never trusted by policy**: anything the Guardian model says about money.

Design consequence: model output can never move funds. Moving funds requires approve + schema-valid data + chain facts + policy + human confirmation + nonce-guarded send.

## Threats and controls

| # | Threat | Control | Test / evidence |
|---|--------|---------|-----------------|
| T1 | Model returns a fabricated `approve` | Decision schema rejects unknown fields/enums; rationale and citations must be present | `validation.test.ts`; `release.test.ts` (malformed decision throws) |
| T2 | Forged decision file (no model at all) | Decision JSON solely drives the recommendation; policy still requires confirmation; contract allowlist must contain the target contract | `policy.test.ts` allowlist cases |
| T3 | Duplicate release / replay of an old approve | On-chain `released` flag read fresh at run time and merged over the caller input; policy denies before any simulation | `release.test.ts` "chain-level duplicate release" |
| T4 | Operator under-reports `amount` to dodge the cap | Chain state read returns the real escrow amount; the policy caps the on-chain amount and the action record logs it | `release.test.ts` "on-chain amount exceeds the cap" |
| T5 | Dispute reopened after the decision | On-chain `disputeOpen` flag overrides the caller's state | `release.test.ts` "chain-reported dispute" |
| T6 | Missing evidence hidden from the caller | `evidencePresent` gate blocks non-approve evidence gaps; chain does not carry evidence, so this flag is operator truth (residual risk, see R1) | `policy.test.ts` evidence case |
| T7 | Malicious or flaky RPC | Reads retry with backoff; on exhaustion the pipeline fails closed to `escalate`, never to pass | `escrow.test.ts` retries; `release.test.ts` chain unavailable |
| T8 | Simulation/send divergence | Every send is preceded by `simulateContract`; a send failure escalates and is never blind-retried; receipts are status-checked | `release.test.ts` simulation/send failure |
| T9 | Reentrancy / contract logic bugs | Minimal contract with `release`/`refund` restricted to the guardian account; CEI-style state flip; not formally audited (R2) | contract source + `base-escrow.test.ts` ABI checks |
| T10 | Private key compromise | Key exists only in env (never committed), guarded by `.gitignore`; used only from a dedicated testnet wallet; no key in logs or output | `.env.example`, `.gitignore` |
| T11 | Operator bypasses confirmation | CLI defaults to an interactive `y/N` prompt; `--yes`/`--dry-run` are explicit and surfaced in the help text | `policy.test.ts` confirmation case; CLI help |
| T12 | Allowlist misconfiguration | Empty allowlist denies by default; only listed contracts can be released from | `policy.test.ts` empty allowlist case |

## Residual risks

- **R1 – evidencePresent is off-chain truth.** It comes from the operator's fixture. The chain only secures funds, not evidence authenticity. For the hackathon scope this is accepted and documented; a hardened version would pin evidence hashes on-chain at funding time.
- **R2 – no formal audit.** The contract is intentionally minimal (one escrow struct, guardian-guarded release/refund) but is not audited. Do not hold real funds.
- **R3 – malicious RPC can lie about reads.** A hostile RPC could report `funded=true, released=false` for a reverted escrow. Mitigations: operator-chosen RPC, human confirmation, and cross-checking the transaction on Basescan after send. The send itself fails the contract guard if the facts are wrong.
- **R4 – one `--yes` weakness.** The `--yes` flag is the operator overriding the confirmation gate. It is a deliberate escape hatch for scripts; the threat model assumes it is not used for production funds.

## Secret handling

- `.env` is git-ignored; `.env.example` documents the variables only.
- `GUARDIAN_PRIVATE_KEY` must be a Base Sepolia testnet key funded via faucet. Never reuse a mainnet key.
- The CLI and `BaseEscrowClient` never print the key; errors quote RPC/chain messages, not credentials.
- Rotate the test wallet if the key ever touches a shared or committed file.