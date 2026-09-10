# Milestone-Escrow Guardian: Three-Person Task Board

**Working agreement:** Each contributor owns an independently runnable workstream. Every task must leave a runnable artifact, tests or evidence, and a short note in the PR/commit. Use mocks, fixtures, and documented interfaces when another workstream is unavailable. No production funds; use Base Sepolia only.

## Ownership

### Contributor 1: Memory and Guardian Logic (You)

- [x] Define the memory taxonomy and project-scoped identifiers.
- [x] Implement real Sibyl writes for requirements, entities, feedback, evidence, decisions, and unresolved issues.
- [x] Implement fresh-session retrieval and context packaging.
- [x] Define the structured decision schema: `approve`, `request_revision`, `escalate`.
- [x] Implement model output validation and cited-memory/cited-evidence rationale.
- [x] Add tests for recall, conflicting feedback, missing context, and malformed output.
- [x] Create the deletion-test script and document the expected degradation.

**Done when:** A seeded project can be evaluated in a new session, and prior feedback changes the result with traceable memory references.

**Status:** Complete in commit `2377a56`. The standalone suite has 8 passing tests, and `scripts/deletion_test.py` demonstrates that removing project memory changes the outcome.

### Contributor 2: Base Escrow and Safety

- [x] Choose and document the minimal Base Sepolia escrow contract/interface.
- [x] Implement read-only escrow state checks and transaction simulation.
- [x] Implement the deterministic policy gate around the Guardian result.
- [x] Enforce dispute, duplicate-release, amount-limit, evidence, and allowlist checks.
- [x] Add explicit user confirmation before release.
- [ ] Send one real testnet release and record receipt/transaction hash.
- [x] Add tests for approval, rejection, escalation, duplicate release, chain failure, and retry behavior.
- [x] Write the threat model and secret-handling instructions.

**Done when:** Only a policy-approved milestone can release escrow, and the transaction is reproducible on Base Sepolia without exposing secrets.

**Status:** Code complete and offline-verified in `contributors/contributor-2-escrow` (39 passing tests, clean `tsc` build, dry-run works for approve/revision/escalate against the mock). ABI generated via `solc`; `MilestoneEscrow` artifact in `dist/contracts/MilestoneEscrow.json`. Threat model in `contributors/contributor-2-escrow/docs/threat-model.md`. Open item: one real Base Sepolia release once the `.env` wallet is faucet-funded.

### Contributor 3: Product Surface, Demo, and Submission

- [x] Build the project/milestone/evidence/decision experience or CLI presentation.
- [x] Show recalled context, model recommendation, deterministic checks, and transaction status separately.
- [x] Add seeded demo data and a reset command.
- [x] Write setup, architecture, memory call locations, partner integration, Prior Work, and license documentation.
- [x] Create the 2-5 minute demo script with timestamp or commit hash visible during recall.
- [x] Run a non-author walkthrough and fix setup/documentation failures.
- [x] Prepare the demo post, build-log post, team details, and submission-page checklist.
- [ ] Confirm registration/late-entry status with Sibyl organizers.

**Done when:** A new contributor can reproduce the full flow quickly and the submission package is complete and truthful.

**Status:** Complete. Zero-dependency ANSI terminal UI (`src/cli.ts`), scenario manager (`src/scenarios.ts`), and standalone web dashboard (`src/server.ts` + `public/`) implemented and verified with 10 passing unit tests. End-to-end integration orchestrator (`integration/orchestrator.ts`) connects C1 -> C2 -> C3. Demo script (`docs/DEMO_SCRIPT.md`), submission posts (`docs/SUBMISSION_POSTS.md`), and MIT license are in place.

## Independent Deliverables

Each contributor should be able to finish and verify their work without waiting for another contributor. Integration starts only after all three standalone deliverables pass their own acceptance checks.

### Contributor 1 interface

- Input fixture: project history, requirements, feedback, and evidence in a documented JSON format seeded into an isolated real Sibyl database.
- Output contract: validated decision JSON containing `outcome`, `rationale`, `confidence`, `cited_memory_ids`, `cited_evidence_ids`, and `missing_information`.
- Local verification: run the Guardian against seeded fixtures with the real Sibyl client and no blockchain or LLM.

### Contributor 2 interface

- Input fixture: decision JSON matching Contributor 1's documented output contract, with no live model or Sibyl dependency.
- Output contract: policy result plus escrow action state and transaction metadata.
- Local verification: run approval, rejection, escalation, duplicate-release, and chain-failure cases against a mock contract before using Base Sepolia.

### Contributor 3 interface

- Input fixture: example project, evidence, decision JSON, policy result, and transaction metadata.
- Output contract: a complete user-facing flow that can render seeded results without the live Guardian or blockchain.
- Local verification: reset and replay the demo using fixtures, then validate the README and video script independently.

## Integration Milestones

- [x] **M0: Interface freeze (all):** agree on the JSON schemas, fixture format, and success criteria.
- [x] **M1: Standalone completion (each contributor):** Contributor 1 (8 tests, deletion test), Contributor 2 (39 tests, solc compile), Contributor 3 (10 tests, tsc build) all verified.
- [x] **M2: Integration (all):** `integration/orchestrator.ts` connects the three deliverables through frozen interfaces.
- [x] **M3: Integrated demo (all):** fresh-session revision path, approval path, audit trail, and resettable seed runnable via `scripts/run-demo.ps1` and `scripts/run-demo.sh`.
- [x] **M4: Final verification (all):** unit tests, deletion test, adversarial cases, and cross-platform verification completed.
- [ ] **M5: Submission (Contributor 3 owner, all reviewers):** record demo video, publish two tagged posts, submit project before final deadline.

## Definition of Done

- [ ] Sibyl Memory is demonstrably load-bearing.
- [ ] Base is exercised by a real Sepolia transaction.
- [ ] No unresolved critical security or reproducibility issue remains.
- [ ] Every PRD acceptance criterion has evidence.
- [ ] All contributors review the final commit and demo before submission.

## Decision Log

- 2026-09-02: MVP constrained to software-freelance milestones so the memory dependency and Base action fit a short hackathon demo.
- 2026-09-02: Agent recommendation is separated from deterministic money-movement policy to reduce safety and judging risk.
- 2026-09-02: Workstreams are independent by default; integration uses frozen JSON contracts, mocks, and fixtures rather than implementation-time dependencies.
