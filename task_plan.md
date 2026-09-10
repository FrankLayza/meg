# Task Plan: Milestone-Escrow Guardian Agent

## Goal

Create a complete, implementation-ready PRD and a three-person execution board for a Sibyl Labs Hackathon submission, covering discovery through post-submission follow-up.

## Phases

- [x] Phase 1: Establish project planning files and capture constraints
- [x] Phase 2: Define the product, architecture, safety model, and lifecycle in the PRD
- [x] Phase 3: Translate the PRD into three-person workstreams and acceptance gates
- [x] Phase 4: Review consistency against the hackathon requirements and deliver
- [x] Phase 5: Generate independent contributor workspaces and shared contracts

## Key Questions

1. How does persistent Sibyl Memory change the milestone decision in a fresh session?
2. What deterministic controls prevent an LLM from releasing escrow unsafely?
3. What is the smallest credible Base integration and demoable product slice?
4. What evidence is required for technical quality, PMF, and the submission checklist?

## Decisions Made

- Position the product as a memory-backed escrow guardian and recommendation workflow, not an unbounded autonomous legal arbiter.
- Use a deterministic policy gate around the model decision and require an explicit onchain transaction path for Base credit.
- Target a narrow software-freelance milestone workflow for the MVP.
- Treat Sibyl Memory as a critical-path dependency with an explicit deletion test and fresh-session recall demo.

## Resolved Toolchain Items

- `pytest` and `sibyl-memory-client` are installed and verified in `.venv` (8 passing unit tests, deletion test passing).
- Node.js (v20.19.5) and pnpm (v10.13.1) are active across the workspace (39 passing escrow tests, 10 passing demo tests).

## Status

**All Contributors (1, 2, and 3) complete; Integration pipeline verified** - The independent workspaces, shared contracts, fixtures, real Sibyl-backed Guardian workflow, Base Sepolia escrow policy gate, presentation surface, web dashboard, and integration orchestrator are implemented and verified.

## Contributor Completion Summary

- **Contributor 1 (Guardian Memory):** Complete. Uses real Sibyl client with SQLite FTS5 across HOT/WARM/REFERENCE/COLD tiers. 8/8 pytest tests pass, deletion test proves memory is load-bearing.
- **Contributor 2 (Base Escrow):** Complete. `MilestoneEscrow.sol` compiled via `solc`. Deterministic policy gate enforces cap, dispute, allowlist, and confirmation. 39/39 unit tests pass, TypeScript builds cleanly.
- **Contributor 3 (Demo Surface):** Complete. Zero-dependency ANSI terminal UI (`cli.ts`), scenario manager (`scenarios.ts`), and standalone web dashboard (`server.ts` + `public/`) implemented. 10/10 unit tests pass, TypeScript builds cleanly.
- **Integration Layer:** Complete. `integration/orchestrator.ts` connects C1 -> C2 -> C3 end-to-end. One-command scripts `scripts/run-demo.ps1` and `scripts/run-demo.sh` provide turnkey reproduction.

