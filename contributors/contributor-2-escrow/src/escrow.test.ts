import test from "node:test";
import assert from "node:assert/strict";
import { EscrowClientError, MockEscrowClient, withReadRetries } from "./escrow.js";

test("#given a read operation, #when it fails once then succeeds, #then retries recover the value", async () => {
  let calls = 0;
  const value = await withReadRetries(
    async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("temporary rpc hiccup");
      }
      return "ok";
    },
    { retries: 2, backoffMs: 1 },
  );
  assert.equal(value, "ok");
  assert.equal(calls, 2);
});

test("#given a read operation, #when it keeps failing, #then retries exhaust and rethrow the last error", async () => {
  await assert.rejects(
    withReadRetries(
      async () => {
        throw new Error("permanent failure");
      },
      { retries: 3, backoffMs: 1 },
    ),
    /permanent failure/,
  );
});

test("#given a MockEscrowClient, #when reading state, #then a snapshot copy is returned", async () => {
  const client = new MockEscrowClient({ snapshot: { funded: true, released: false, disputeOpen: true } });
  const snapshot = await client.getEscrowState("milestone-001");
  assert.deepEqual(snapshot, { funded: true, released: false, disputeOpen: true });
});

test("#given a released mock escrow, #when simulating a release, #then it throws already-released", async () => {
  const client = new MockEscrowClient({ snapshot: { funded: true, released: true, disputeOpen: false } });
  await assert.rejects(client.simulateRelease("milestone-001"), EscrowClientError);
});

test("#given an unfunded mock escrow, #when releasing, #then it throws not-funded", async () => {
  const client = new MockEscrowClient({ snapshot: { funded: false, released: false, disputeOpen: false } });
  await assert.rejects(client.release("milestone-001"), (error: unknown) => {
    return error instanceof EscrowClientError && error.kind === "not_funded";
  });
});