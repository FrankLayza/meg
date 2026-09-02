# Contributor 1: Sibyl Guardian

This package owns real Sibyl Memory integration and the Guardian decision contract. It is independently runnable without an LLM, UI, or blockchain.

## Install

```powershell
python -m pip install -e ".[test]"
```

## Run

```powershell
guardian-review ..\..\shared\fixtures\review-request-missing-idempotency.json --seed --database .sibyl-memory\guardian.db
```

The `--seed` run stores requirements and feedback in Sibyl. A later run against the same database represents a fresh session and retrieves the stored context.

## Sibyl Tier Mapping

- HOT: current milestone review state via `set_state`.
- WARM: project entity via `set_entity`.
- COLD: feedback, evidence, and decisions via `write_event`.
- REFERENCE: acceptance criteria via `set_reference`.
- ARCHIVE: reserved for superseded project entities.

## Future Model

Replace `DeterministicReasoner` with a provider implementing `ReasoningProvider`. The provider receives the bounded context and evidence, then returns the decision contract. Sibyl retrieval and validation remain in this package.
