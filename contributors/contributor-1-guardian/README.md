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

## Verification

Run the standalone suite with the workspace virtual environment:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

The tests use a real `MemoryClient.local(...)` database under pytest's temporary directory. They cover fresh-session recall, approval, missing evidence, unresolved issues, contradictory feedback, malformed input, and the memory-deletion case. The deletion case runs the same request against an empty database and verifies that the Guardian escalates because no project criteria can be recalled.

## Sibyl Tier Mapping

- HOT: current milestone review state via `set_state`.
- WARM: project entity via `set_entity`.
- COLD: feedback, evidence, unresolved issues, prior decisions, and current decisions via `write_event`.
- REFERENCE: acceptance criteria via `set_reference`.
- ARCHIVE: reserved for superseded project entities.

## Future Model

Replace `DeterministicReasoner` with a provider implementing `ReasoningProvider`. The provider receives the bounded context and evidence, then returns the decision contract. Sibyl retrieval and validation remain in this package.
