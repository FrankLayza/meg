# Contributor 1 Handoff: Memory and Guardian Logic

You own the part of the product that remembers the project history and turns that history into a structured milestone recommendation.

## Your Goal

Build an independently runnable Guardian module that accepts a sample project history and deliverable evidence, recalls the relevant context through a memory interface, and returns a validated decision:

- `approve`
- `request_revision`
- `escalate`

You do not need the UI, live blockchain, or the other contributors' code to finish this work. Use an isolated local Sibyl database path for tests, but do not substitute a fake memory implementation.

## What You Build

1. A memory adapter interface backed by the real Sibyl Memory client.
2. Memory records for:
   - project requirements,
   - client or backer expectations,
   - feedback events,
   - submitted evidence,
   - unresolved issues,
   - prior decisions.
3. A retrieval function that gathers context for one project and milestone.
4. A Guardian evaluation function that compares evidence with recalled context.
5. A strict decision schema with rationale, confidence, cited memory IDs, cited evidence IDs, and missing information.
6. Tests proving that different histories can produce different outcomes.
7. A deletion test showing that bypassing memory causes the evaluation to fail or lose project-specific context.

## Standalone Input

Use a documented fixture format containing:

- project and milestone identifiers,
- acceptance criteria,
- stakeholder feedback,
- unresolved issues,
- submitted evidence.

The fixture must be usable without the UI, Base, or an LLM. It should seed the real Sibyl client in an isolated local database.

## Standalone Output

Return JSON matching this shape:

```json
{
  "outcome": "request_revision",
  "rationale": "The submission improves the UI but does not address the previously recorded idempotency requirement.",
  "confidence": 0.91,
  "cited_memory_ids": ["feedback-002", "criteria-001"],
  "cited_evidence_ids": ["commit-abc123"],
  "missing_information": ["No evidence of retry behavior"]
}
```

Contributor 2 will consume this output later. Keep the schema stable and documented.

## First Implementation Order

- [ ] Create the fixture JSON format and one seeded project.
- [ ] Install and verify the official `sibyl-memory-client` package.
- [ ] Create the memory adapter interface backed by a real local Sibyl database.
- [ ] Implement memory writes and project-scoped retrieval.
- [ ] Implement the decision schema and validator.
- [ ] Implement the Guardian evaluation against the real Sibyl adapter and a temporary deterministic reasoning function.
- [ ] Add the fresh-session recall test.
- [ ] Add contradictory-feedback and missing-evidence tests.
- [ ] Add the deletion test.
- [ ] Document the real Sibyl integration points for later wiring.

## Definition of Done

- A clean checkout can run your tests without blockchain, UI, or LLM dependencies.
- A seeded fresh-session test recalls a prior requirement and changes the result.
- The output always validates against the documented schema.
- Every decision cites the relevant memory and evidence records.
- The deletion test demonstrates that memory is load-bearing.
- Contributor 2 can use your sample output without reading your implementation.
