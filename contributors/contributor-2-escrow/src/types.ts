export type GuardianOutcome = "approve" | "request_revision" | "escalate";

export interface GuardianDecision {
  outcome: GuardianOutcome;
  rationale: string;
  confidence: number;
  cited_memory_ids: string[];
  cited_evidence_ids: string[];
  missing_information: string[];
}

export interface EscrowState {
  milestoneId: string;
  amount: bigint;
  released: boolean;
  disputeOpen: boolean;
  evidencePresent: boolean;
}

export interface PolicyResult {
  allowed: boolean;
  reason: string;
  decision_outcome: GuardianOutcome;
  escrow_action: "release" | "hold" | "escalate";
  transaction_hash: string | null;
  receipt_status: string | null;
}
