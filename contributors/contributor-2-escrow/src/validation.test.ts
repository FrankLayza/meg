import test from "node:test";
import assert from "node:assert/strict";
import { validateDecision, validatePolicyResult } from "./validation.js";
import type { GuardianDecision, PolicyResult } from "./types.js";

function makeDecision(overrides?: Partial<GuardianDecision>): GuardianDecision {
  return {
    outcome: "approve",
    rationale: "All requirements are addressed.",
    confidence: 0.9,
    cited_memory_ids: ["criteria-001"],
    cited_evidence_ids: ["commit-def456"],
    missing_information: [],
    ...overrides,
  };
}

function makePolicyResult(overrides?: Partial<PolicyResult>): PolicyResult {
  return {
    allowed: true,
    reason: "Policy checks passed.",
    decision_outcome: "approve",
    escrow_action: "release",
    transaction_hash: null,
    receipt_status: null,
    ...overrides,
  };
}

test("#given a valid decision, #when validated, #then it passes", async () => {
  const result = await validateDecision(makeDecision());
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("rejects an unknown outcome enum value", async () => {
  const result = await validateDecision(makeDecision({ outcome: "maybe" as never }));
  assert.equal(result.ok, false);
});

test("rejects a decision with a missing required field", async () => {
  const { rationale: _omitted, ...withoutRationale } = makeDecision();
  const result = await validateDecision(withoutRationale);
  assert.equal(result.ok, false);
});

test("rejects a decision with confidence out of range", async () => {
  const result = await validateDecision(makeDecision({ confidence: 1.5 }));
  assert.equal(result.ok, false);
});

test("rejects a decision with an unlisted property", async () => {
  const result = await validateDecision({ ...makeDecision(), extra: "field" });
  assert.equal(result.ok, false);
});

test("#given a valid policy result, #when validated, #then it passes", async () => {
  const result = await validatePolicyResult(makePolicyResult());
  assert.equal(result.ok, true);
});

test("rejects a policy result with an invalid escrow_action", async () => {
  const result = await validatePolicyResult(makePolicyResult({ escrow_action: "refund" as never }));
  assert.equal(result.ok, false);
});

test("rejects a policy result missing the reason", async () => {
  const { reason: _omitted, ...withoutReason } = makePolicyResult();
  const result = await validatePolicyResult(withoutReason);
  assert.equal(result.ok, false);
});

test("rejects a policy result with an unlisted property", async () => {
  const result = await validatePolicyResult({ ...makePolicyResult(), audit: "extra" });
  assert.equal(result.ok, false);
});