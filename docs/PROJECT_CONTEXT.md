# Project Context: Milestone-Escrow Guardian

## Product

Milestone-Escrow Guardian is a memory-backed mediator for software-freelance milestones. It recalls the project's evolving requirements, stakeholder feedback, prior submissions, unresolved issues, and previous decisions before evaluating new deliverable evidence.

The agent recommends `approve`, `request_revision`, or `escalate`. A separate deterministic policy layer controls whether an escrow release is allowed on Base Sepolia.

## Hackathon Constraint

Sibyl Memory must be load-bearing. In a fresh session, the agent must recall earlier project-specific context and use it to change what it decides. Removing the memory layer must break or materially degrade the core evaluation.

## Team Ownership

- Contributor 1 (the user): real Sibyl Memory integration, context retrieval, Guardian decision contract, validation, and memory deletion test.
- Contributor 2: deterministic escrow policy and Base integration.
- Contributor 3: user-facing product surface, demo, README, and submission package.

Each stream is independently runnable. Integration happens through documented JSON contracts after standalone verification.

## Current Scope

- One software-freelance project.
- One milestone.
- One client/backer and one freelancer.
- Base Sepolia testnet only.
- No LLM integration yet; the model provider remains a replaceable interface.

## Current Language Decision

Contributor 1 should use Python for the first implementation because Sibyl documents `sibyl-memory-client` as the direct SDK with full read/write access to all memory tiers. A TypeScript application can be added later through Sibyl's MCP server, but the official docs do not describe a TypeScript SDK with the same direct API surface.
