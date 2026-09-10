import type { EscrowState, GuardianDecision, GuardianOutcome, PolicyConfig, PolicyResult } from "./types.js";

export function evaluatePolicy(
  decision: GuardianDecision,
  escrow: EscrowState,
  config: PolicyConfig,
  confirmed: boolean,
): PolicyResult {
  if (decision.outcome !== "approve") {
    return deny(decision.outcome, "hold", "Only an approved Guardian decision can release escrow.");
  }
  if (decision.missing_information.length > 0) {
    return deny(decision.outcome, "hold", "All mandatory acceptance criteria must be addressed before release.");
  }
  if (escrow.released) {
    return deny(decision.outcome, "hold", "This milestone has already been released.");
  }
  if (!escrow.funded) {
    return deny(decision.outcome, "hold", "The escrow has not been funded.");
  }
  if (escrow.disputeOpen) {
    return deny(decision.outcome, "escalate", "An open dispute blocks escrow release and requires human review.");
  }
  if (!escrow.evidencePresent) {
    return deny(decision.outcome, "hold", "Evidence is required before release.");
  }
  if (escrow.amount > config.maxAmount) {
    return deny(decision.outcome, "escalate", "The milestone exceeds the configured release limit.");
  }
  if (!config.allowlistedContracts.includes(escrow.contract_address)) {
    return deny(decision.outcome, "escalate", "The escrow contract is not allowlisted.");
  }
  if (config.requireConfirmation && !confirmed) {
    return deny(decision.outcome, "hold", "Explicit user confirmation is required.");
  }
  return {
    allowed: true,
    reason: "Policy checks passed; escrow release may be sent.",
    decision_outcome: decision.outcome,
    escrow_action: "release",
    transaction_hash: null,
    receipt_status: null,
  };
}

export function deny(
  decisionOutcome: GuardianOutcome,
  escrowAction: PolicyResult["escrow_action"],
  reason: string,
): PolicyResult {
  return {
    allowed: false,
    reason,
    decision_outcome: decisionOutcome,
    escrow_action: escrowAction,
    transaction_hash: null,
    receipt_status: null,
  };
}
