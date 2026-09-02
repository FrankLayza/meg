# Milestone-Escrow Guardian: Three-Person Task Board

**Working agreement:** Each contributor owns an independently runnable workstream. Every task must leave a runnable artifact, tests or evidence, and a short note in the PR/commit. Use mocks, fixtures, and documented interfaces when another workstream is unavailable. No production funds; use Base Sepolia only.

## Ownership

### Contributor 1: Memory and Guardian Logic

- [ ] Define the memory taxonomy and project-scoped identifiers.
- [ ] Implement Sibyl writes for requirements, entities, feedback, evidence, decisions, and unresolved issues.
- [ ] Implement fresh-session retrieval and context packaging.
- [ ] Define the structured decision schema: `approve`, `request_revision`, `escalate`.
- [ ] Implement model output validation and cited-memory/cited-evidence rationale.
- [ ] Add tests for recall, conflicting feedback, missing context, and malformed output.
- [ ] Create the deletion-test script and document the expected degradation.

**Done when:** A seeded project can be evaluated in a new session, and prior feedback changes the result with traceable memory references.

### Contributor 2: Base Escrow and Safety

- [ ] Choose and document the minimal Base Sepolia escrow contract/interface.
- [ ] Implement read-only escrow state checks and transaction simulation.
- [ ] Implement the deterministic policy gate around the Guardian result.
- [ ] Enforce dispute, duplicate-release, amount-limit, evidence, and allowlist checks.
- [ ] Add explicit user confirmation before release.
- [ ] Send one real testnet release and record receipt/transaction hash.
- [ ] Add tests for approval, rejection, escalation, duplicate release, chain failure, and retry behavior.
- [ ] Write the threat model and secret-handling instructions.

**Done when:** Only a policy-approved milestone can release escrow, and the transaction is reproducible on Base Sepolia without exposing secrets.

### Contributor 3: Product Surface, Demo, and Submission

- [ ] Build the project/milestone/evidence/decision experience or CLI presentation.
- [ ] Show recalled context, model recommendation, deterministic checks, and transaction status separately.
- [ ] Add seeded demo data and a reset command.
- [ ] Write setup, architecture, memory call locations, partner integration, Prior Work, and license documentation.
- [ ] Create the 2-5 minute demo script with timestamp or commit hash visible during recall.
- [ ] Run a non-author walkthrough and fix setup/documentation failures.
- [ ] Prepare the demo post, build-log post, team details, and submission-page checklist.
- [ ] Confirm registration/late-entry status with Sibyl organizers.

**Done when:** A new contributor can reproduce the full flow quickly and the submission package is complete and truthful.

## Independent Deliverables

Each contributor should be able to finish and verify their work without waiting for another contributor. Integration starts only after all three standalone deliverables pass their own acceptance checks.

### Contributor 1 interface

- Input fixture: project history, requirements, feedback, and evidence in a documented JSON format.
- Output contract: validated decision JSON containing `outcome`, `rationale`, `confidence`, `cited_memory_ids`, `cited_evidence_ids`, and `missing_information`.
- Local verification: run the Guardian against seeded fixtures with a fake memory adapter and no blockchain.

### Contributor 2 interface

- Input fixture: decision JSON matching Contributor 1's documented output contract, with no live model or Sibyl dependency.
- Output contract: policy result plus escrow action state and transaction metadata.
- Local verification: run approval, rejection, escalation, duplicate-release, and chain-failure cases against a mock contract before using Base Sepolia.

### Contributor 3 interface

- Input fixture: example project, evidence, decision JSON, policy result, and transaction metadata.
- Output contract: a complete user-facing flow that can render seeded results without the live Guardian or blockchain.
- Local verification: reset and replay the demo using fixtures, then validate the README and video script independently.

## Integration Milestones

- [ ] **M0: Interface freeze (all):** agree on the JSON schemas, fixture format, and success criteria. This is a short coordination step, not a blocking implementation dependency.
- [ ] **M1: Standalone completion (each contributor):** each workstream passes its own local verification using mocks or fixtures.
- [ ] **M2: Integration (all):** connect the three completed deliverables through the frozen interfaces.
- [ ] **M3: Integrated demo (all):** fresh-session revision path, approval path, audit trail, and resettable seed.
- [ ] **M4: Final verification (all):** tests, deletion test, adversarial cases, second-run test, and non-author setup walkthrough.
- [ ] **M5: Submission (Contributor 3 owner, all reviewers):** public repo, MIT/Apache license, README, video, two tagged posts, and build page marked ready.

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
