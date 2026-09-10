export type GuardianOutcome = "approve" | "request_revision" | "escalate";
export type EscrowAction = "release" | "hold" | "escalate";
export type ChainId = "base_sepolia";

export interface GuardianDecision {
  outcome: GuardianOutcome;
  rationale: string;
  confidence: number;
  cited_memory_ids: string[];
  cited_evidence_ids: string[];
  missing_information: string[];
}

export interface EscrowOnchainSnapshot {
  funded: boolean;
  released: boolean;
  disputeOpen: boolean;
  amount?: bigint;
}

export interface EscrowState {
  milestoneId: string;
  contract_address: string;
  amount: bigint;
  funded: boolean;
  released: boolean;
  disputeOpen: boolean;
  evidencePresent: boolean;
}

export interface PolicyConfig {
  maxAmount: bigint;
  requireConfirmation: boolean;
  allowlistedContracts: readonly string[];
}

export interface PolicyResult {
  allowed: boolean;
  reason: string;
  decision_outcome: GuardianOutcome;
  escrow_action: EscrowAction;
  transaction_hash: string | null;
  receipt_status: string | null;
}

export interface EscrowActionRecord {
  action: EscrowAction;
  chain: ChainId;
  contract_address: string;
  milestone_id: string;
  amount: string;
  actor: string;
  tx_hash: string | null;
  receipt_status: string | null;
  policy_result: PolicyResult;
  decision: GuardianDecision;
  input_hash: string;
  created_at: string;
}
