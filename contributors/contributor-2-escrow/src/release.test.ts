import test from "node:test";
import assert from "node:assert/strict";
import { EscrowClientError, MockEscrowClient } from "./escrow.js";
import { InvalidDecisionError, runRelease } from "./release.js";
import { validatePolicyResult } from "./validation.js";
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

test("#given a scheme-valid approved decision and funded escrow, #when confirmed, #then it releases and records the receipt", async () => {
  const client = new MockEscrowClient();
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow(),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, true);
  assert.equal(output.policyResult.escrow_action, "release");
  assert.equal(output.policyResult.transaction_hash, "mock-milestone-001-1");
  assert.equal(output.policyResult.receipt_status, "confirmed");
  assert.equal(output.escrowAction.tx_hash, output.policyResult.transaction_hash);
  assert.equal(output.escrowAction.action, "release");
  assert.equal(output.escrowAction.chain, "base_sepolia");
  assert.equal(output.escrowAction.amount, "100");
  assert.equal(output.escrowAction.actor, "demo-user");
  assert.equal(client.releaseCalls, 1);

  const schemaCheck = await validatePolicyResult(output.policyResult);
  assert.equal(schemaCheck.ok, true);
});

test("#given an unconfirmed approval, #when run, #then it holds without sending", async () => {
  const client = new MockEscrowClient();
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow(),
    config: makeConfig(),
    confirmed: false,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "hold");
  assert.equal(client.releaseCalls, 0);
});

test("#given unreachable chain reads, #when run, #then it fails closed to escalate", async () => {
  const client = new MockEscrowClient({ failReads: 5, snapshot: { funded: true, released: false, disputeOpen: false } });
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow(),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "escalate");
  assert.match(output.policyResult.reason, /Chain state unavailable/);
  assert.equal(output.policyResult.transaction_hash, null);
  assert.equal(client.releaseCalls, 0);
});

test("#given a release simulation that fails, #when run, #then it escalates and never sends", async () => {
  const client = new MockEscrowClient({ failSimulation: true, snapshot: { funded: true, released: false, disputeOpen: false } });
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow(),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "escalate");
  assert.match(output.policyResult.reason, /simulation failed/i);
  assert.equal(client.releaseCalls, 0);
});

test("#given a send failure, #when run, #then it escalates and does not blind-retry the transaction", async () => {
  const client = new MockEscrowClient({
    failRelease: true,
    releaseError: new EscrowClientError("send_failure", "RPC dropped the transaction."),
  });
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow(),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "escalate");
  assert.match(output.policyResult.reason, /Release transaction failed/i);
  assert.equal(output.policyResult.transaction_hash, null);
  assert.equal(client.releaseCalls, 1);
});

test("#given an on-chain escrow whose amount exceeds the cap, #when run, #then it escalates even if the caller reports a smaller amount", async () => {
  const client = new MockEscrowClient({ snapshot: { funded: true, released: false, disputeOpen: false, amount: 1000n } });
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow({ amount: 10n }),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "escalate");
  assert.match(output.policyResult.reason, /exceeds/);
  assert.equal(output.escrowAction.amount, "1000");
  assert.equal(client.releaseCalls, 0);
});

test("#given a chain-level duplicate release, #when run, #then it holds without sending", async () => {
  const client = new MockEscrowClient({ snapshot: { funded: true, released: true, disputeOpen: false } });
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow({ released: false }),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "hold");
  assert.match(output.policyResult.reason, /already been released/);
  assert.equal(client.releaseCalls, 0);
});

test("#given a chain-reported dispute, #when run, #then the on-chain flag overrides the caller's claiming no dispute", async () => {
  const client = new MockEscrowClient({ snapshot: { funded: true, released: false, disputeOpen: true } });
  const output = await runRelease({
    decision: makeDecision(),
    escrow: makeEscrow({ disputeOpen: false }),
    config: makeConfig(),
    confirmed: true,
    actor: "demo-user",
    client,
  });

  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "escalate");
});

test("#given a malformed decision, #when run, #then it fails closed and throws", async () => {
  const client = new MockEscrowClient();
  await assert.rejects(
    runRelease({
      decision: { ...makeDecision(), outcome: "approve_extra" } as never,
      escrow: makeEscrow(),
      config: makeConfig(),
      confirmed: true,
      actor: "demo-user",
      client,
    }),
    InvalidDecisionError,
  );
});

test("#given a confirmed approval in dry-run mode, #when run, #then it simulates without sending", async () => {
  const client = new MockEscrowClient();
  const output = await runRelease({
    decision: makeDecision(), escrow: makeEscrow(), config: makeConfig(),
    confirmed: true, dryRun: true, actor: "demo-user", client,
  });
  assert.equal(output.policyResult.allowed, true);
  assert.equal(output.policyResult.transaction_hash, null);
  assert.equal(client.releaseCalls, 0);
  assert.equal(output.escrowAction.input_hash.length, 64);
  assert.deepEqual(output.escrowAction.decision, makeDecision());
});

test("#given an approved decision with missing information, #when run, #then it holds without sending", async () => {
  const client = new MockEscrowClient();
  const output = await runRelease({
    decision: makeDecision({ missing_information: ["Acceptance criterion status"] }),
    escrow: makeEscrow(), config: makeConfig(), confirmed: true, actor: "demo-user", client,
  });
  assert.equal(output.policyResult.allowed, false);
  assert.equal(output.policyResult.escrow_action, "hold");
  assert.match(output.policyResult.reason, /mandatory acceptance criteria/i);
  assert.equal(client.releaseCalls, 0);
});
