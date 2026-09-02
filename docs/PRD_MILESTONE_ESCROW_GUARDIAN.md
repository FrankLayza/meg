# Product Requirements Document: Milestone-Escrow Guardian Agent

**Version:** 0.1 | **Owner:** Team | **Status:** Implementation baseline | **Target:** Sibyl Labs Hackathon

## 1. Product Summary

Milestone-Escrow Guardian is a memory-backed agent for software-freelance milestones. It evaluates a submitted deliverable against the original scope, evolving stakeholder expectations, prior critiques, and unresolved issues. It recommends `approve`, `request_revision`, or `escalate`; a deterministic policy gate decides whether approval may release escrow through a Base testnet contract.

The product is deliberately a guarded decision workflow, not an autonomous legal arbiter. The model supplies contextual judgment; deterministic software controls money movement.

## 2. Problem and Users

Freelancers and clients lose time and trust when milestone agreements evolve in chat, feedback is forgotten, and escrow decisions depend on whoever remembers the latest context. The primary users are a freelancer submitting work and a client/backer reviewing it. A secondary user is a mediator who needs an auditable explanation and evidence trail.

## 3. Goals and Success Measures

### Goals

- Demonstrate that Sibyl Memory changes a milestone decision in a fresh session.
- Give both parties a concise, evidence-linked explanation of the outcome.
- Execute a real, bounded Base testnet escrow release for an approved milestone.
- Make setup, memory call locations, policy checks, and demo reproduction obvious to judges.

### Success measures

- A fresh session recalls a prior requirement and reaches a different outcome than a history-free run.
- Removing Sibyl Memory causes the core evaluation to fail or materially degrade.
- No transaction is sent unless the deterministic policy gate passes.
- A new contributor can run the demo from the README in under 15 minutes.
- The final repository, video, posts, and license satisfy the hackathon checklist.

## 4. Non-Goals

- Legal arbitration, binding dispute resolution, or guaranteed objective truth.
- General-purpose crowdfunding or multi-chain escrow in the MVP.
- Unrestricted autonomous wallet access or production custody of user funds.
- Training a new foundation model or building a replacement memory database.

## 5. MVP Scope

- One software-freelance project with one client/backer and one freelancer.
- One milestone with a configurable escrow amount on Base Sepolia.
- Inputs: milestone requirements, stakeholder feedback, deliverable evidence, and optional revision response.
- Outcomes: approve, request revision, or escalate to human review.
- Sibyl Memory persistence for requirements, entities, feedback events, evidence, decisions, and unresolved issues.
- A web or CLI interface that makes the memory-backed evaluation and transaction state visible.

## 6. User Journeys

### Project setup

1. Client creates a project and milestone with acceptance criteria.
2. The system stores the criteria and parties in Sibyl Memory.
3. Client adds nuanced expectations and risk flags; the system records them as dated feedback.
4. Escrow is funded on Base Sepolia and the transaction hash is displayed.

### Iterative review

1. Freelancer submits a commit, document, or demo URL as evidence.
2. Agent recalls the relevant requirements, feedback, prior decisions, and unresolved issues.
3. Agent produces structured findings with citations to stored context and submitted evidence.
4. Policy gate validates the result and chooses approval, revision, or escalation.

### Approval and release

1. Only a policy-approved `approve` result enables the release action.
2. User confirms the action in the MVP UI.
3. The service sends the bounded Base testnet transaction.
4. Transaction hash, decision, memory references, and policy result are appended to the audit record.

### Fresh-session recall

The demo starts a new agent session, submits a deliverable that conflicts with an earlier requirement, and shows the agent recalling that requirement and requesting revision. A second submission satisfying it demonstrates approval and the Base transaction.

## 7. Functional Requirements

### Memory and reasoning

- Persist original criteria, stakeholder entities, feedback events, evidence metadata, decisions, and unresolved issues through Sibyl Memory.
- Retrieve only project-scoped context relevant to the active milestone.
- Distinguish facts, preferences, open questions, and agent inferences.
- Return structured JSON with outcome, confidence, cited memories, cited evidence, missing information, and rationale.
- Make the memory write/read code paths easy to find in the README and source.

### Policy and escrow

- Validate the agent result against a strict schema; invalid output fails closed.
- Require all mandatory acceptance criteria to be addressed before approval.
- Block release when a dispute is open, evidence is missing, the milestone is already released, or the amount exceeds the configured limit.
- Require explicit user confirmation for the transaction in the MVP.
- Use a testnet wallet with minimal funds and an allowlisted escrow contract.
- Never expose private keys in logs, prompts, repository files, or client-side source.

### Auditability

- Record input hashes, memory record identifiers, model result, policy result, actor, timestamps, and transaction hash.
- Make every decision reproducible from the saved project state and evidence references.
- Provide an escalation path with a human-readable reason.

### UX

- Show project context, current milestone, decision state, evidence, recalled context, policy checks, and transaction status.
- Clearly label model recommendations versus deterministic checks.
- Support loading a seeded demo project for judges.
- Provide useful error states for missing memory, invalid evidence, unavailable chain, and policy rejection.

## 8. Technical Design

### Components

- **Client:** project and milestone views, evidence submission, decision explanation, and transaction confirmation.
- **Guardian service:** orchestration, Sibyl reads/writes, model call, schema validation, and policy evaluation.
- **Sibyl Memory:** local structured persistence and search; project/entity identifiers provide tenant isolation.
- **Base adapter:** escrow contract client, transaction simulation, send, and receipt tracking.
- **Audit store:** append-only decision records; can initially use the same local database if integrity boundaries are explicit.

### Decision pipeline

`input validation -> memory retrieval -> evidence analysis -> structured recommendation -> deterministic policy gate -> human confirmation -> Base transaction -> audit append`

### Initial data model

- `Project`: id, parties, currency, status, created_at.
- `Milestone`: id, project_id, criteria, amount, due_at, status.
- `FeedbackEvent`: author, content, tags, timestamp, supersedes.
- `Evidence`: type, locator, content hash, submitted_by, timestamp.
- `Decision`: outcome, rationale, confidence, cited_memory_ids, cited_evidence_ids, policy_result.
- `EscrowAction`: action, chain, contract, tx_hash, receipt_status, actor.

## 9. Quality, Security, and Operations

- Unit-test memory adapters, decision schema validation, policy rules, and escrow state transitions.
- Integration-test a seeded project from setup through Base Sepolia receipt.
- Add a deletion-test script that removes Sibyl calls and demonstrates the core behavior degrades.
- Add adversarial cases: contradictory feedback, prompt injection in evidence, missing criteria, duplicate release, stale sessions, chain failure, and malformed model output.
- Log structured events without secrets or raw sensitive deliverables.
- Provide retry handling for read-only operations; never blindly retry a transaction without checking nonce and receipt state.
- Pin dependencies, document Python/runtime versions, and provide one-command local setup.
- Define rollback: disable release actions, preserve audit data, and require human review if policy or chain behavior is uncertain.

## 10. Lifecycle Plan

### Discover

Validate the target workflow with at least three realistic milestone examples. Confirm late-entry eligibility with Sibyl organizers because the published registration deadline has passed.

### Define

Freeze the MVP scope, decision schema, memory taxonomy, policy rules, contract interface, threat model, and demo script. Record assumptions and Prior Work.

### Build

Implement vertical slices in this order: memory-backed review, policy gate, Base escrow action, UI/CLI, audit trail, then polish. Keep a runnable seeded demo after every slice.

### Verify

Run unit, integration, adversarial, deletion, fresh-session, and second-run tests. Verify the Base transaction and README call locations. Conduct a non-author walkthrough.

### Release

Tag a reproducible commit, publish the MIT or Apache-2.0 repository, record the demo in one continuous 2-5 minute take, add the build log and demo posts, and submit from the registered build page.

### Operate and learn

Monitor demo failures, policy rejections, chain receipts, and memory retrieval misses. Collect feedback from at least three reviewers and document follow-up work; do not silently alter the submitted demo path.

## 11. Acceptance Criteria

- [ ] A new session recalls a prior project-specific requirement and uses it in a decision.
- [ ] Deleting or bypassing Sibyl Memory breaks or materially degrades the evaluation.
- [ ] The README identifies every memory write/read call in under two minutes.
- [ ] Approval cannot bypass the deterministic policy gate.
- [ ] An approved milestone executes one real Base Sepolia escrow release and shows its hash.
- [ ] A rejected or escalated milestone never sends a release transaction.
- [ ] Tests cover happy path, revision path, escalation, duplicate release, malformed output, and chain failure.
- [ ] Public repository has MIT or Apache-2.0 license, setup instructions, real commits, and Prior Work declaration.
- [ ] Demo is 2-5 minutes and includes the unedited fresh-session recall moment.

## 12. Hackathon Submission Checklist

- Public GitHub repository and license
- Complete README with memory implementation note, partner-stack locations, and Prior Work
- 2-5 minute demo video with timestamp or commit hash visible during fresh-session recall
- Team members and Base integration identified
- Demo video post and build-log post tagging `@sibylcap` and Base
- Submission marked ready by the official deadline if the team has an eligible registration link

## 13. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Agent appears arbitrary or legally authoritative | Use recommendation language, evidence citations, escalation, and deterministic policy checks |
| Memory is judged decorative | Make prior feedback change the outcome and include the deletion test |
| Base integration is decorative | Execute and show a real testnet escrow transaction |
| Prompt injection in deliverables | Treat evidence as untrusted data; isolate instructions from content and validate outputs |
| Demo is too broad | Use one milestone, one contract, one seeded story, and two outcomes |
| Registration is closed | Confirm eligibility immediately through the official Discord or organizer contact |

## 14. Open Decisions

- Exact contract implementation: custom escrow versus existing audited testnet primitive.
- UI stack versus CLI-first demo based on the team’s strongest existing skills.
- Model/provider and budget for evaluation calls.
- Whether a second partner integration is worth the added complexity and demo risk.
- Organizer confirmation of late registration, team size, and final submission access.
