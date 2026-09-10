import test from "node:test";
import assert from "node:assert/strict";

import { loadAllScenarios, loadScenario } from "./scenarios.js";
import { renderScenario } from "./renderer.js";
import { stripAnsi } from "./formatters.js";

test("#given all scenarios, #when loaded, #then three distinct scenarios are returned", async () => {
  const scenarios = await loadAllScenarios();
  assert.equal(scenarios.length, 3);
  assert.deepEqual(scenarios.map((s) => s.id), ["revision", "approved", "escalated"]);
});

test("#given the revision scenario, #when loaded and rendered, #then revision badges and missing items appear", async () => {
  const scenario = await loadScenario("revision");
  assert.equal(scenario.decision.outcome, "request_revision");
  assert.equal(scenario.policyResult.allowed, false);

  const rendered = stripAnsi(renderScenario(scenario));
  assert.match(rendered, /REVISION REQUIRED/);
  assert.match(rendered, /RECALLED SIBYL MEMORY CONTEXT/);
  assert.match(rendered, /DETERMINISTIC SAFETY POLICY/);
  assert.match(rendered, /BASE SEPOLIA ESCROW EXECUTION/);
});

test("#given the approved scenario, #when loaded and rendered, #then release action and basescan details appear", async () => {
  const scenario = await loadScenario("approved");
  assert.equal(scenario.decision.outcome, "approve");
  assert.equal(scenario.policyResult.allowed, true);
  assert.equal(scenario.escrowAction.action, "release");

  const rendered = stripAnsi(renderScenario(scenario));
  assert.match(rendered, /APPROVED/);
  assert.match(rendered, /POLICY PASS/);
  assert.match(rendered, /RELEASE/);
  assert.match(rendered, /sepolia\.basescan\.org/);
});

test("#given the escalated scenario, #when loaded and rendered, #then escalation notices appear", async () => {
  const scenario = await loadScenario("escalated");
  assert.equal(scenario.decision.outcome, "escalate");
  assert.equal(scenario.policyResult.allowed, false);

  const rendered = stripAnsi(renderScenario(scenario));
  assert.match(rendered, /HUMAN ESCALATION/);
  assert.match(rendered, /BLOCKED/);
});

test("#given simulated parameters, #when evaluated, #then handles custom criteria correctly", async () => {
  const { buildSimulatedScenario } = await import("./scenarios.js");

  // Approval case
  const approvedSim = buildSimulatedScenario({
    commitSha: "commit-pass-42",
    hasRetries: true,
    hasIdempotency: true,
    hasDispute: false,
  });
  assert.equal(approvedSim.decision.outcome, "approve");
  assert.equal(approvedSim.policyResult.allowed, true);
  assert.equal(approvedSim.escrowAction.action, "release");

  // Missing idempotency case
  const revisionSim = buildSimulatedScenario({
    commitSha: "commit-fail-idem",
    hasRetries: true,
    hasIdempotency: false,
    hasDispute: false,
  });
  assert.equal(revisionSim.decision.outcome, "request_revision");
  assert.equal(revisionSim.policyResult.allowed, false);
  assert.equal(revisionSim.escrowAction.action, "hold");

  // Dispute lock case
  const disputeSim = buildSimulatedScenario({
    commitSha: "commit-dispute",
    hasDispute: true,
  });
  assert.equal(disputeSim.decision.outcome, "escalate");
  assert.equal(disputeSim.policyResult.allowed, false);
  assert.equal(disputeSim.escrowAction.action, "escalate");
});
