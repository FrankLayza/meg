# Milestone-Escrow Guardian: Three-Person Task Board

**Working agreement:** Each task must leave a runnable artifact, tests or evidence, and a short note in the PR/commit. Keep the seeded demo working at the end of every phase. No production funds; use Base Sepolia only.

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

## Shared Milestones and Dependencies

- [ ] **M0: Eligibility and scope (all):** confirm registration status, freeze one-milestone MVP, choose stack, and agree on acceptance criteria.
- [ ] **M1: Memory vertical slice (1 + 3):** seeded project, recall, decision output, and visible rationale.
- [ ] **M2: Safety and Base vertical slice (2 + 1):** policy gate consumes the decision schema and executes a bounded testnet release.
- [ ] **M3: Integrated demo (all):** fresh-session revision path, approval path, audit trail, and resettable seed.
- [ ] **M4: Verification (all):** tests, deletion test, adversarial cases, second-run test, and non-author setup walkthrough.
- [ ] **M5: Submission (3 owner, all reviewers):** public repo, MIT/Apache license, README, video, two tagged posts, and build page marked ready.

## Definition of Done

- [ ] Sibyl Memory is demonstrably load-bearing.
- [ ] Base is exercised by a real Sepolia transaction.
- [ ] No unresolved critical security or reproducibility issue remains.
- [ ] Every PRD acceptance criterion has evidence.
- [ ] All contributors review the final commit and demo before submission.

## Decision Log

- 2026-09-02: MVP constrained to software-freelance milestones so the memory dependency and Base action fit a short hackathon demo.
- 2026-09-02: Agent recommendation is separated from deterministic money-movement policy to reduce safety and judging risk.
