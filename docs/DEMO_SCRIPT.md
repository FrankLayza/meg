# Demo Video Script: Milestone-Escrow Guardian

**Target Duration:** 3:30 – 4:30 minutes | **Format:** Continuous recording with visible system clock or terminal git commit hash.

---

## Storyboard

### 0:00 – 0:45 | Introduction

- **Show:** Terminal at repository root. Run `git log -1 --oneline` to get the commit hash on screen with the system clock visible.
- **Talk through:**
  - This is Milestone-Escrow Guardian, built for the Sibyl Labs Hackathon with Base integration.
  - The problem: in software freelancing, requirements and feedback change over time. When a milestone is submitted for review, the person evaluating it often doesn't have the full history — older critiques get lost, and that leads to bad payouts or unnecessary disputes.
  - We built an agent that uses Sibyl Memory to persist all of that context and recall it in fresh sessions. The key safety constraint: the AI recommends an outcome, but a separate deterministic policy layer controls whether money actually moves.

---

### 0:45 – 2:00 | Fresh-Session Recall (the load-bearing memory moment)

- **Show:** Clean terminal. Git commit hash or timestamp visible. Run the revision scenario.
- **Command:**
  ```powershell
  pnpm --filter milestone-guardian-demo run demo:revision
  ```
- **Talk through:**
  - In an earlier session, the client set up milestone criteria and added feedback saying "focus on API retries and idempotency." That got stored in Sibyl Memory across the WARM, REFERENCE, and COLD tiers.
  - Now this is a fresh session — no chat history, no context carried over except what's in Sibyl.
  - The freelancer submits commit `abc123` which adds API endpoints and UI work, but doesn't mention retries or idempotency.
  - The Guardian queries Sibyl Memory, finds feedback-001 requiring idempotency, and returns "revision required" with that citation.
  - Below that, the deterministic policy gate sees the revision verdict, checks on-chain facts, and blocks the release. Escrow status: HOLD. No funds moved.

---

### 2:00 – 3:00 | Resolution and Base Sepolia Release

- **Show:** Terminal. Run the approved scenario.
- **Command:**
  ```powershell
  pnpm --filter milestone-guardian-demo run demo:approved
  ```
- **Talk through:**
  - The freelancer comes back with commit `def456` — this time with retry logic and idempotency headers.
  - The Guardian reviews against Sibyl Memory again, finds all criteria satisfied, and recommends "approve" at 95% confidence.
  - The policy gate runs its checks independently: escrow is funded on Base Sepolia, no disputes, amount under the cap, contract is allowlisted, and user confirmation is granted.
  - All checks pass. The contract client executes `release()` on Base Sepolia. We get the transaction hash and a Basescan link.

---

### 3:00 – 3:45 | Deletion Test (proving memory is load-bearing)

- **Show:** Run the deletion test script in Python.
- **Command:**
  ```powershell
  .\.venv\Scripts\python.exe .\contributors\contributor-1-guardian\scripts\deletion_test.py
  ```
- **Talk through:**
  - Per the hackathon requirement, Sibyl Memory has to be load-bearing — removing it should break or degrade the evaluation.
  - This script runs the same deliverable against a wiped database. With memory, the Guardian correctly identified missing idempotency and cited the relevant feedback. Without memory, it loses all project context and falls back to "escalate."
  - Memory is load-bearing.

---

### 3:45 – 4:15 | Web Dashboard

- **Show:** Browser at `http://localhost:3000`. Click through the 3 scenario tabs, show the raw JSON audit trail.
- **Talk through:**
  - For anyone who wants to explore interactively: the web dashboard lets you switch between scenarios, inspect the JSON decision contracts, and see the full audit trail.
  - There's also a simulation sandbox where you can test custom deliverables with different criteria toggles.

---

### 4:15 – 4:30 | Wrap Up

- **Show:** GitHub repository README.
- **Talk through:**
  - Everything is MIT licensed, open source, and each contributor workstream runs independently. Thanks for watching.
