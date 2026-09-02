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

**Ready for implementation** - Independent contributor workspaces, shared contracts, fixtures, and Contributor 1's real Sibyl implementation tasks are scaffolded below.

## Contributor 1 Implementation Tasks

- [ ] Install and verify `sibyl-memory-client` from the official Sibyl package.
- [ ] Define the project and milestone fixture schema.
- [ ] Implement a real Sibyl-backed memory adapter using an isolated local database for tests.
- [ ] Map requirements, entities, feedback, evidence, decisions, and unresolved issues to Sibyl tiers.
- [ ] Implement project-scoped retrieval and bounded review-context assembly.
- [ ] Define and validate the `approve` / `request_revision` / `escalate` decision JSON contract.
- [ ] Add a temporary deterministic reasoning function so the memory workflow runs without an LLM.
- [ ] Add fresh-session recall, contradictory-feedback, missing-evidence, and malformed-decision tests.
- [ ] Add the deletion test proving the evaluation loses project-specific context without Sibyl Memory.
- [ ] Document the future LLM provider interface and MCP/TypeScript integration boundary.
