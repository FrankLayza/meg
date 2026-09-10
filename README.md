# Milestone-Escrow Guardian

A memory-backed escrow mediator for software-freelance milestones built for the **Sibyl Labs Hackathon** with **Base Sepolia** integration.

---

## Overview

Freelance milestones frequently derail when requirements and critiques evolve across chat threads and meetings. When work is submitted, critical context is forgotten, leading to wrongful dispute escalation or premature fund releases.

**Milestone-Escrow Guardian** introduces persistent **Sibyl Memory** into milestone evaluation:
- **Persistent Memory:** Stores acceptance criteria, evolving client critiques, prior reviews, and unresolved issues across sessions.
- **AI Judgment (Advisory):** Evaluates submitted deliverable code against scoped historical context and recommends `approve`, `request_revision`, or `escalate`.
- **Deterministic Policy Gate (Enforced Invariant):** **Model recommendations never move money.** A deterministic software policy gate independently verifies on-chain escrow facts, dispute state, amount caps, allowlists, and explicit operator confirmation before executing a release on **Base Sepolia**.

---

## Sibyl Memory Call Locations (Judge Note)

Sibyl Memory is strictly **load-bearing**: removing or wiping the memory database causes the evaluation to fail closed to `escalate` (proven by automated deletion tests).

| Operation | Sibyl Tier | Method | File & Line Reference |
|---|---|---|---|
| **Write Project Entity** | WARM | `set_entity` | [`sibyl_store.py:35-44`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L35-L44) |
| **Write Review State** | HOT | `set_state` | [`sibyl_store.py:45-48`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L45-L48) |
| **Write Acceptance Criteria** | REFERENCE | `set_reference` | [`sibyl_store.py:49-52`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L49-L52) |
| **Write Feedback & Issues** | COLD | `write_event` | [`sibyl_store.py:53-59`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L53-L59) |
| **Read Criteria Reference** | REFERENCE | `get_reference` | [`sibyl_store.py:85`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L85) |
| **Read Project Entity** | WARM | `get_entity` | [`sibyl_store.py:94-98`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L94-L98) |
| **Read Historical Events** | COLD | `read_events` | [`sibyl_store.py:108-127`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L108-L127) |
| **Update Decision State** | HOT / COLD | `set_state` / `write_event` | [`sibyl_store.py:75-82`](contributors/contributor-1-guardian/src/guardian_memory/sibyl_store.py#L75-L82) |

---

## Base Sepolia Escrow Integration

- **Smart Contract:** [`MilestoneEscrow.sol`](contributors/contributor-2-escrow/contracts/MilestoneEscrow.sol) — Native ETH escrow with guardian-gated release and dispute protection.
- **Contract Client:** [`base-escrow.ts`](contributors/contributor-2-escrow/src/base-escrow.ts) — viem-based client reading on-chain facts, simulating calls, and executing releases.
- **Deterministic Policy:** [`policy.ts`](contributors/contributor-2-escrow/src/policy.ts) — Enforces that only an approved decision with verified funding, no open disputes, allowable amounts, and confirmed user approval can move escrow.
- **Threat Model:** [`threat-model.md`](contributors/contributor-2-escrow/docs/threat-model.md) — Documents trust boundaries and adversarial failure cases.

---

## Quickstart (< 2 Minutes)

### 1. Run the End-to-End Live Pipeline Demo

Executes Contributor 1 (Python / Sibyl) → Contributor 2 (TypeScript / Base Policy) → Contributor 3 (Terminal UI):

```powershell
# On Windows
.\scripts\run-demo.ps1

# On Unix / macOS
./scripts/run-demo.sh
```

To run the **Revision scenario** (where fresh session recalls earlier backer feedback requiring idempotency):
```powershell
.\scripts\run-demo.ps1 -Revision
```

### 2. Standalone Web Dashboard

Launch the interactive local dashboard:
```powershell
pnpm --filter milestone-guardian-demo run serve
```
Open **[http://localhost:3000](http://localhost:3000)** to inspect scenario audits, memory tier mappings, and raw JSON contracts.

### 3. Interactive Terminal Walkthrough

```powershell
pnpm --filter milestone-guardian-demo run demo
```

---

## Independent Contributor Verification

Each workstream is decoupled and independently runnable:

### Contributor 1: Memory & Reasoning (Python)
```powershell
# In .venv with sibyl-memory-client
pytest .\contributors\contributor-1-guardian\tests

# Run the Deletion Test (proves evaluation degrades without Sibyl Memory)
python .\contributors\contributor-1-guardian\scripts\deletion_test.py
```

### Contributor 2: Base Escrow & Policy Gate (TypeScript)
```powershell
pnpm --filter milestone-guardian-escrow test        # 39 unit tests
pnpm --filter milestone-guardian-escrow run build  # tsc build
pnpm --filter milestone-guardian-escrow run demo   # offline mock release demo
```

### Contributor 3: Presentation & Demo Surface (TypeScript)
```powershell
pnpm --filter milestone-guardian-demo test         # 11 format & scenario tests
pnpm --filter milestone-guardian-demo run build    # tsc build
pnpm --filter milestone-guardian-demo run demo:revision
pnpm --filter milestone-guardian-demo run demo:approved
```

---

## Prior Work Declaration

All core application logic—including the Sibyl Memory schema mapping, deterministic escrow policy engine, Solidity smart contract, and dual presentation surface—was created during the Sibyl Labs Hackathon 2026. External open-source packages utilized include `sibyl-memory-client` (Python), `viem` (TypeScript EVM client), and standard compiler toolchains (`solc`, `ajv`, `tsx`, `pytest`).

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).
