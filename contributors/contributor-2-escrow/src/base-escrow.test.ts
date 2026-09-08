import test from "node:test";
import assert from "node:assert/strict";
import { escrowAbi } from "./escrow-abi.gen.js";
import { BaseEscrowClient, milestoneKey } from "./base-escrow.js";

test("#given a milestone id, #when hashing a milestone key, #then it is deterministic and id-distinct", () => {
  assert.equal(milestoneKey("milestone-001"), milestoneKey("milestone-001"));
  assert.notEqual(milestoneKey("milestone-001"), milestoneKey("milestone-002"));
});

test("compiled ABI exposes the guarded operations", () => {
  const functions = escrowAbi
    .filter((item) => item.type === "function")
    .map((item) => (item as { name: string }).name);
  for (const name of ["fund", "release", "refund", "setDispute", "setFreelancer", "escrows", "guardian"]) {
    assert.ok(functions.includes(name), `expected ${name} in ABI`);
  }
});

test("#given incomplete configuration, #when constructing a Base client, #then it throws", () => {
  assert.throws(() => {
    new BaseEscrowClient({
      rpcUrl: "https://sepolia.base.org",
      privateKey: "",
      contractAddress: "0x1111111111111111111111111111111111111111",
    });
  });
});

test("#given an invalid private key, #when constructing a Base client, #then it throws", () => {
  assert.throws(() => {
    new BaseEscrowClient({
      rpcUrl: "https://sepolia.base.org",
      privateKey: "not-a-key",
      contractAddress: "0x1111111111111111111111111111111111111111",
    });
  });
});