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

## Errors Encountered

- `pytest` is not installed in the environment, so Python tests could not be executed yet; Python source compilation passed.
- Node.js is not available on the current PATH, so TypeScript builds/tests must be run after the Node toolchain is installed or enabled.

## Status

**Contributor 1 complete; Contributors 2 and 3 pending** - The independent workspaces, shared contracts, fixtures, and the real Sibyl-backed Guardian workflow are implemented and verified. Integration remains gated on the other two standalone workstreams.

## Contributor 1 Implementation Tasks

- [x] Install and verify `sibyl-memory-client` from the official Sibyl package.
- [x] Define the project and milestone fixture schema.
- [x] Implement a real Sibyl-backed memory adapter using an isolated local database for tests.
- [x] Map requirements, entities, feedback, evidence, decisions, and unresolved issues to Sibyl tiers.
- [x] Implement project-scoped retrieval and bounded review-context assembly.
- [x] Define and validate the `approve` / `request_revision` / `escalate` decision JSON contract.
- [x] Add a temporary deterministic reasoning function so the memory workflow runs without an LLM.
- [x] Add fresh-session recall, contradictory-feedback, missing-evidence, and malformed-decision tests.
- [x] Add the deletion test proving the evaluation loses project-specific context without Sibyl Memory.
- [x] Document the future LLM provider interface and MCP/TypeScript integration boundary.

## Contributor 1 Completion

Contributor 1 is complete in commit `2377a56`. The implementation uses the real Sibyl client, retrieves scoped event history through `read_events()`, validates the shared decision contract, and keeps the model provider replaceable through `ReasoningProvider`. Verification: 8 tests passed, Python compilation passed, CLI replay passed, and the deletion test confirmed a different outcome without memory.
