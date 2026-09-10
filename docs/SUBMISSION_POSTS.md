# Hackathon Submission Posts

Two public posts tagging `@sibylcap` and Base, required by submission rules.

---

## Post 1: Demo Video

```text
We built Milestone-Escrow Guardian for the @sibylcap Hackathon — a memory-backed mediator that evaluates freelance milestones against their full project history before allowing escrow to move on @base Sepolia.

The core idea: freelance milestone reviews fall apart when feedback from earlier sessions gets lost. Our agent uses Sibyl Memory to persist criteria, stakeholder critiques, and dispute history across fresh sessions, then evaluates new deliverables against that context.

The safety rule is simple — the AI recommends, but deterministic code controls money. A policy gate checks on-chain facts, dispute state, amount caps, and operator confirmation before any release executes.

Demo video (fresh-session recall + deletion test): [LINK TO DEMO VIDEO]
Source: https://github.com/FrankLayza/pea

#SibylLabs #Base #BuildOnBase
```

---

## Post 2: Build Log

```text
Build log for Milestone-Escrow Guardian (@sibylcap Hackathon, @base integration).

We mapped milestone lifecycle data across four Sibyl Memory tiers:
- WARM for project and party entities
- REFERENCE for acceptance criteria
- COLD for dated feedback and prior decisions
- HOT for active review state

The pipeline runs: deliverable submitted -> Sibyl recall -> AI verdict -> deterministic policy gate -> Base Sepolia escrow release. The policy gate enforces a cap, dispute check, contract allowlist, and explicit user confirmation before anything moves.

If you wipe the Sibyl database, the evaluation fails closed to "escalate" — we have an automated deletion test that proves it.

Three independent workstreams (Python memory layer, TypeScript escrow policy, TypeScript demo surface) connected through frozen JSON contracts.

Repo (MIT): https://github.com/FrankLayza/pea

#BuildOnBase #SibylLabs
```
