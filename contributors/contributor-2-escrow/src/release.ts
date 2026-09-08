import { deny, evaluatePolicy } from "./policy.js";
import { validateDecision, validatePolicyResult } from "./validation.js";
import type { EscrowClient } from "./escrow.js";
import type { EscrowActionRecord, EscrowOnchainSnapshot, EscrowState, GuardianDecision, PolicyConfig, PolicyResult } from "./types.js";

export interface ReleaseInput {
  decision: GuardianDecision;
  escrow: EscrowState;
  config: PolicyConfig;
  confirmed: boolean;
  actor: string;
  client: EscrowClient;
}

export interface ReleaseOutput {
  policyResult: PolicyResult;
  escrowAction: EscrowActionRecord;
}

export class InvalidDecisionError extends Error {
  public constructor(errors: string[]) {
    super(`Invalid Guardian decision: ${errors.join("; ")}`);
    this.name = "InvalidDecisionError";
  }
}

export async function runRelease(input: ReleaseInput): Promise<ReleaseOutput> {
  const decisionValidation = await validateDecision(input.decision);
  if (!decisionValidation.ok) {
    throw new InvalidDecisionError(decisionValidation.errors);
  }

  let snapshot: EscrowOnchainSnapshot;
  try {
    snapshot = await input.client.getEscrowState(input.escrow.milestoneId);
  } catch (error) {
    const policy = deny(input.decision.outcome, "escalate", `Chain state unavailable: ${describe(error)}`);
    return buildOutput(policy, input);
  }

  const state: EscrowState = {
    ...input.escrow,
    funded: snapshot.funded,
    released: snapshot.released,
    disputeOpen: snapshot.disputeOpen,
    amount: snapshot.amount ?? input.escrow.amount,
  };

  let policy = evaluatePolicy(input.decision, state, input.config, input.confirmed);

  if (policy.allowed) {
    try {
      await input.client.simulateRelease(state.milestoneId);
    } catch (error) {
      policy = deny(input.decision.outcome, "escalate", `Release simulation failed: ${describe(error)}`);
    }
  }

  if (policy.allowed) {
    try {
      const receipt = await input.client.release(state.milestoneId);
      policy = {
        ...policy,
        transaction_hash: receipt.transactionHash,
        receipt_status: receipt.receiptStatus,
      };
    } catch (error) {
      policy = deny(input.decision.outcome, "escalate", `Release transaction failed: ${describe(error)}`);
    }
  }

  return buildOutput(policy, input, state.amount);
}

async function buildOutput(policy: PolicyResult, input: ReleaseInput, chainAmount?: bigint): Promise<ReleaseOutput> {
  const policyValidation = await validatePolicyResult(policy);
  if (!policyValidation.ok) {
    throw new Error(`Internal policy result failed schema validation: ${policyValidation.errors.join("; ")}`);
  }
  const escrowAction: EscrowActionRecord = {
    action: policy.escrow_action,
    chain: "base_sepolia",
    contract_address: input.escrow.contract_address,
    milestone_id: input.escrow.milestoneId,
    amount: (chainAmount ?? input.escrow.amount).toString(),
    actor: input.actor,
    tx_hash: policy.transaction_hash,
    receipt_status: policy.receipt_status,
    policy_result: policy,
    created_at: new Date().toISOString(),
  };
  return { policyResult: policy, escrowAction };
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}