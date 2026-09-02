# Notes: Milestone-Escrow Guardian Agent

## Sources

### Sibyl Labs Hackathon Rules
- URL: https://hack.sibyllabs.org/rules
- One challenge and one leaderboard.
- Sibyl Memory must be load-bearing: removing it must break or materially degrade the core function.
- Demo must show fresh-session recall in one continuous, unedited segment with a timestamp or commit hash.
- Rubric: memory 40, innovation 25, technical execution 20, pitch 15; PMF bonus up to 10.
- Base and Virtuals partner stacks add +15% then +10%, capped at x1.25, only when exercised in the product.
- Required submission: public MIT/Apache repository, 2-5 minute demo, README implementation note and Prior Work declaration, team/stack details, and two public posts.

### Sibyl Documentation
- URL: https://docs.sibyllabs.org/
- Sibyl Memory is local-first, file-based memory backed by SQLite and FTS5, with zero embeddings.
- Official setup: `pip install 'sibyl-memory-cli[mcp]'`, `sibyl init`, and `sibyl setup`.
- Supports Codex, Claude Code, Cursor, Hermes, and MCP-compatible clients.

### Product Direction
- URL: https://hack.sibyllabs.org/ (project brief and positioning)
- The Guardian evaluates milestone deliverables against evolving requirements, prior critiques, and unresolved issues.
- Base integration should execute a testnet escrow release after policy checks pass.

## Synthesized Findings

### Product Boundary

The agent should recommend and execute a guarded milestone outcome for a narrow software-freelance workflow. It is not an objective legal arbiter and must not have unrestricted authority to move funds.

### Critical Memory Path

Persist original acceptance criteria, stakeholder expectations, iteration feedback, evidence reviewed, unresolved issues, and prior decisions. Recall those records in a later session and use them to produce a decision that differs when the history differs.

### Safety Boundary

The model proposes `approve`, `request_revision`, or `escalate`. A deterministic policy gate checks schema validity, required evidence, dispute state, spending limits, and approval conditions before any Base transaction.

### Demo Shape

Session A records a backer requirement about API retries and idempotency. Session B receives a polished deliverable missing that requirement; the agent recalls the earlier feedback, requests revision, and does not release escrow. A second run with the requirement satisfied triggers the guarded Base testnet release.

### Timing Constraint

The site states registration closed August 31, 2026, while the build window ends September 10, 2026. Confirm late-entry status or an existing registered-team link through the official Discord before relying on submission eligibility.
