import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePolicy } from "./policy.js";
import type { EscrowState, GuardianDecision } from "./types.js";

const decision: GuardianDecision = {
  outcome: "approve",
  rationale: "All requirements are addressed.",
  confidence: 0.9,
  cited_memory_ids: ["criteria"],
  cited_evidence_ids: ["commit-def456"],
  missing_information: [],
};

const escrow: EscrowState = {
  milestoneId: "milestone-001",
  amount: 100n,
  released: false,
  disputeOpen: false,
  evidencePresent: true,
};

test("requires explicit confirmation", () => {
  const result = evaluatePolicy(decision, escrow, { maxAmount: 500n, requireConfirmation: true }, false);
  assert.equal(result.allowed, false);
});

test("allows a bounded confirmed release", () => {
  const result = evaluatePolicy(decision, escrow, { maxAmount: 500n, requireConfirmation: true }, true);
  assert.equal(result.allowed, true);
  assert.equal(result.escrow_action, "release");
});
