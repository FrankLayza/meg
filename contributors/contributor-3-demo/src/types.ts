export type GuardianOutcome = "approve" | "request_revision" | "escalate";

export type EscrowActionType = "release" | "hold" | "escalate";

export interface FeedbackItem {
  id: string;
  author: string;
  content: string;
}

export interface EvidenceItem {
  id: string;
  type: string;
  locator: string;
  summary: string;
  content_hash?: string;
}

export interface UnresolvedIssueItem {
  id: string;
  description: string;
}

export interface PriorDecisionItem {
  id: string;
  outcome: GuardianOutcome;
  rationale: string;
}

export interface ReviewFixture {
  project_id: string;
  milestone_id: string;
  acceptance_criteria: string[];
  feedback: FeedbackItem[];
  evidence: EvidenceItem[];
  unresolved_issues?: UnresolvedIssueItem[];
  prior_decisions?: PriorDecisionItem[];
}

export interface GuardianDecision {
  outcome: GuardianOutcome;
  rationale: string;
  confidence: number;
  cited_memory_ids: string[];
  cited_evidence_ids: string[];
  missing_information: string[];
}

export interface PolicyResult {
  allowed: boolean;
  reason: string;
  decision_outcome: GuardianOutcome;
  escrow_action: EscrowActionType;
  transaction_hash: string | null;
  receipt_status: "confirmed" | "failed" | null;
}

export interface EscrowActionRecord {
  action: EscrowActionType;
  chain: string;
  contract_address: string;
  milestone_id: string;
  amount: string;
  actor: string;
  tx_hash: string | null;
  receipt_status: "confirmed" | "failed" | null;
  policy_result: PolicyResult;
  created_at: string;
}

export interface SimulationParams {
  commitSha?: string;
  summary?: string;
  hasRetries?: boolean;
  hasIdempotency?: boolean;
  hasDispute?: boolean;
  confidence?: number;
}

export type DemoScenarioId = "revision" | "approved" | "escalated" | "simulated";

export interface PolicyCheckItem {
  name: string;
  passed: boolean;
  details: string;
}

export interface DemoScenario {
  id: DemoScenarioId;
  title: string;
  description: string;
  sessionBadge: string;
  fixture: ReviewFixture;
  decision: GuardianDecision;
  policyResult: PolicyResult;
  escrowAction: EscrowActionRecord;
  policyChecks: PolicyCheckItem[];
}
