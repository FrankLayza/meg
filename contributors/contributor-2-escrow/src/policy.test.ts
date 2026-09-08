import test from "node:test";
import assert from "node:assert/strict";
import { deny, evaluatePolicy } from "./policy.js";
import type { EscrowState, GuardianDecision, PolicyConfig } from "./types.js";

const CONTRACT = "0x1111111111111111111111111111111111111111";

function makeDecision(overrides?: Partial<GuardianDecision>): GuardianDecision {
  return {
    outcome: "approve",
    rationale: "All recalled acceptance criteria are addressed.",
    confidence: 0.9,
    cited_memory_ids: ["criteria-001"],
    cited_evidence_ids: ["commit-def456"],
    missing_information: [],
    ...overrides,
  };
}

function makeEscrow(overrides?: Partial<EscrowState>): EscrowState {
  return {
    milestoneId: "milestone-001",
    contract_address: CONTRACT,
    amount: 100n,
    funded: true,
    released: false,
    disputeOpen: false,
    evidencePresent: true,
    ...overrides,
  };
}

function makeConfig(overrides?: Partial<PolicyConfig>): PolicyConfig {
  return {
    maxAmount: 500n,
    requireConfirmation: true,
    allowlistedContracts: [CONTRACT],
    ...overrides,
  };
}

test("allows a bounded confirmed release", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow(), makeConfig(), true);
  assert.equal(result.allowed, true);
  assert.equal(result.escrow_action, "release");
  assert.equal(result.transaction_hash, null);
});

test("blocks release without explicit confirmation", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow(), makeConfig(), false);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "hold");
});

test("blocks a request_revision decision", () => {
  const result = evaluatePolicy(makeDecision({ outcome: "request_revision" }), makeEscrow(), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "hold");
  assert.equal(result.decision_outcome, "request_revision");
});

test("blocks an escalate decision", () => {
  const result = evaluatePolicy(makeDecision({ outcome: "escalate" }), makeEscrow(), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "hold");
  assert.equal(result.decision_outcome, "escalate");
});

test("blocks duplicate release for an already-released milestone", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow({ released: true }), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "hold");
});

test("blocks release when the escrow is not funded", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow({ funded: false }), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "hold");
});

test("escalates on an open dispute", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow({ disputeOpen: true }), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "escalate");
});

test("blocks release when evidence is missing", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow({ evidencePresent: false }), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "hold");
});

test("escalates when the amount exceeds the configured limit", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow({ amount: 600n }), makeConfig(), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "escalate");
});

test("escalates when the escrow contract is not allowlisted", () => {
  const result = evaluatePolicy(
    makeDecision(),
    makeEscrow({ contract_address: "0x2222222222222222222222222222222222222222" }),
    makeConfig(),
    true,
  );
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "escalate");
});

test("escalates when the allowlist is empty by default", () => {
  const result = evaluatePolicy(makeDecision(), makeEscrow(), makeConfig({ allowlistedContracts: [] }), true);
  assert.equal(result.allowed, false);
  assert.equal(result.escrow_action, "escalate");
});

test("deny helper emits a schema-shaped policy result", () => {
  const result = deny("approve", "escalate", "blocked");
  assert.deepEqual(result, {
    allowed: false,
    reason: "blocked",
    decision_outcome: "approve",
    escrow_action: "escalate",
    transaction_hash: null,
    receipt_status: null,
  });
});