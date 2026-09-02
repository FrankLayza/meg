# Milestone-Escrow Guardian

A memory-backed milestone mediator for the Sibyl Labs Hackathon.

## Repository Layout

```text
shared/
  contracts/       JSON schemas shared by every contributor
  fixtures/        seeded project and review examples
contributors/
  contributor-1-guardian/  Python + real Sibyl Memory integration
  contributor-2-escrow/    TypeScript policy and escrow boundary
  contributor-3-demo/      TypeScript demo/presentation surface
integration/       wiring notes and cross-contributor examples
docs/              PRD, context, and Sibyl architecture notes
```

Contributor folders are intentionally independent and can be renamed later. They communicate through the files in `shared/contracts/` and `shared/fixtures/`.

## Getting Started

### Contributor 1

Requires Python 3.10+ and the official Sibyl client:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e ".\contributors\contributor-1-guardian[test]"
pytest .\contributors\contributor-1-guardian\tests
```

The Guardian uses `MemoryClient.local(...)` and an isolated local SQLite database for tests. No LLM or blockchain is required for the standalone workstream.

### Contributors 2 and 3

Requires Node.js 20+:

```powershell
cd contributors\contributor-2-escrow
npm install
npm test

cd ..\contributor-3-demo
npm install
npm run demo
```

## Integration Contract

Contributor 1 emits a decision matching `shared/contracts/decision.schema.json`. Contributor 2 consumes it and emits a policy result matching `shared/contracts/policy-result.schema.json`. Contributor 3 can render both using the fixtures and types in its own folder.

See [integration/README.md](integration/README.md) for the assembly sequence.
