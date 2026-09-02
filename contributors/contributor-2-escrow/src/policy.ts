import type { EscrowState, GuardianDecision, PolicyResult } from "./types.js";

export interface PolicyConfig {
  maxAmount: bigint;
  requireConfirmation: boolean;
}

export function evaluatePolicy(
  decision: GuardianDecision,
  escrow: EscrowState,
  config: PolicyConfig,
  confirmed: boolean,
): PolicyResult {
  if (decision.outcome !== "approve") {
    return result(false, "Only an approved Guardian decision can release escrow.", decision.outcome, "hold");
  }
  if (escrow.released) {
    return result(false, "This milestone has already been released.", decision.outcome, "hold");
  }
  if (escrow.disputeOpen) {
    return result(false, "An open dispute blocks escrow release.", decision.outcome, "escalate");
  }
  if (!escrow.evidencePresent) {
    return result(false, "Evidence is required before release.", decision.outcome, "hold");
  }
  if (escrow.amount > config.maxAmount) {
    return result(false, "The milestone exceeds the configured release limit.", decision.outcome, "escalate");
  }
  if (config.requireConfirmation && !confirmed) {
    return result(false, "Explicit user confirmation is required.", decision.outcome, "hold");
  }
  return result(true, "Policy checks passed; escrow release may be sent.", decision.outcome, "release");
}

function result(
  allowed: boolean,
  reason: string,
  decision_outcome: GuardianDecision["outcome"],
  escrow_action: PolicyResult["escrow_action"],
): PolicyResult {
  return { allowed, reason, decision_outcome, escrow_action, transaction_hash: null, receipt_status: null };
}
