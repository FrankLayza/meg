import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  DemoScenario,
  DemoScenarioId,
  ReviewFixture,
  GuardianDecision,
  GuardianOutcome,
  PolicyResult,
  EscrowActionRecord,
  EscrowActionType,
  PolicyCheckItem,
  SimulationParams,
} from "./types.js";

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..", "..", "..");
const SHARED_FIXTURES = resolve(REPO_ROOT, "shared", "fixtures");

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadScenario(id: DemoScenarioId): Promise<DemoScenario> {
  switch (id) {
    case "revision":
      return buildRevisionScenario();
    case "approved":
      return buildApprovedScenario();
    case "escalated":
      return buildEscalatedScenario();
    case "simulated":
      return buildSimulatedScenario();
    default: {
      const exhaustiveCheck: never = id;
      throw new Error(`Unhandled scenario id: ${String(exhaustiveCheck)}`);
    }
  }
}

export async function loadAllScenarios(): Promise<DemoScenario[]> {
  const [revision, approved, escalated] = await Promise.all([
    buildRevisionScenario(),
    buildApprovedScenario(),
    buildEscalatedScenario(),
  ]);
  return [revision, approved, escalated];
}

async function buildRevisionScenario(): Promise<DemoScenario> {
  const fixturePath = resolve(SHARED_FIXTURES, "review-request-missing-idempotency.json");
  const decisionPath = resolve(SHARED_FIXTURES, "decision-revision.json");

  const diskFixture = await readJsonFile<ReviewFixture>(fixturePath);
  const diskDecision = await readJsonFile<GuardianDecision>(decisionPath);

  const fixture: ReviewFixture = diskFixture ?? {
    project_id: "project-001",
    milestone_id: "milestone-001",
    acceptance_criteria: [
      "API requests must support retries",
      "API requests must be idempotent",
    ],
    feedback: [
      {
        id: "feedback-001",
        author: "backer-001",
        content: "Please focus the next iteration on API architecture, retries, and idempotency.",
      },
    ],
    evidence: [
      {
        id: "commit-abc123",
        type: "github_commit",
        locator: "https://github.com/example/project/commit/abc123",
        summary: "Adds API endpoints and improves the dashboard UI, but does not mention retries or idempotency.",
        content_hash: "sha256:example-abc123",
      },
    ],
  };

  const decision: GuardianDecision = diskDecision ?? {
    outcome: "request_revision",
    rationale: "The submission improves the UI but does not address the previously recorded idempotency requirement.",
    confidence: 0.91,
    cited_memory_ids: ["feedback-001", "criteria-001"],
    cited_evidence_ids: ["commit-abc123"],
    missing_information: ["No evidence of idempotency or retry behavior"],
  };

  const policyResult: PolicyResult = {
    allowed: false,
    reason: "Only an approved Guardian decision can release escrow.",
    decision_outcome: "request_revision",
    escrow_action: "hold",
    transaction_hash: null,
    receipt_status: null,
  };

  const escrowAction: EscrowActionRecord = {
    action: "hold",
    chain: "base_sepolia",
    contract_address: "0x1111111111111111111111111111111111111111",
    milestone_id: "milestone-001",
    amount: "100000000000000000",
    actor: "guardian-policy-gate",
    tx_hash: null,
    receipt_status: null,
    policy_result: policyResult,
    created_at: "2026-09-10T08:30:00.000Z",
  };

  const policyChecks: PolicyCheckItem[] = [
    { name: "Approved Decision Gate", passed: false, details: "Guardian returned request_revision (Approved verdict required)" },
    { name: "Escrow Funded on Base", passed: true, details: "0.10 ETH locked in MilestoneEscrow" },
    { name: "No Active Disputes", passed: true, details: "disputeOpen = false on-chain" },
    { name: "Evidence Provided", passed: true, details: "commit-abc123 present" },
    { name: "Amount Below Safety Cap", passed: true, details: "0.10 ETH <= 1.00 ETH limit" },
    { name: "Contract Allowlisted", passed: true, details: "0x1111...1111 in ESCROW_ALLOWLIST" },
    { name: "Operator Confirmation", passed: false, details: "Skipped because approval check failed" },
  ];

  return {
    id: "revision",
    title: "Fresh-Session Recall: Revision Required",
    description: "Session 2 evaluates new deliverable code. Recalls backer critique from Session 1 stored in Sibyl Memory and detects missing idempotency. Denies release without moving funds.",
    sessionBadge: "SESSION 2 (FRESH RECALL)",
    fixture,
    decision,
    policyResult,
    escrowAction,
    policyChecks,
  };
}

async function buildApprovedScenario(): Promise<DemoScenario> {
  const fixturePath = resolve(SHARED_FIXTURES, "review-request-approved.json");
  const decisionPath = resolve(SHARED_FIXTURES, "decision-approved.json");

  const diskFixture = await readJsonFile<ReviewFixture>(fixturePath);
  const diskDecision = await readJsonFile<GuardianDecision>(decisionPath);

  const fixture: ReviewFixture = diskFixture ?? {
    project_id: "project-001",
    milestone_id: "milestone-001",
    acceptance_criteria: [
      "API requests must support retries",
      "API requests must be idempotent",
    ],
    feedback: [
      {
        id: "feedback-001",
        author: "backer-001",
        content: "Please focus the next iteration on API architecture, retries, and idempotency.",
      },
    ],
    evidence: [
      {
        id: "commit-def456",
        type: "github_commit",
        locator: "https://github.com/example/project/commit/def456",
        summary: "Adds retry logic and idempotency headers for API requests.",
        content_hash: "sha256:example-def456",
      },
    ],
  };

  const decision: GuardianDecision = diskDecision ?? {
    outcome: "approve",
    rationale: "The submission addresses all recalled criteria and prior feedback items.",
    confidence: 0.95,
    cited_memory_ids: ["criteria-001", "feedback-001"],
    cited_evidence_ids: ["commit-def456"],
    missing_information: [],
  };

  const policyResult: PolicyResult = {
    allowed: true,
    reason: "Policy checks passed; escrow release may be sent.",
    decision_outcome: "approve",
    escrow_action: "release",
    transaction_hash: "0x8f2d4e7b1a9c3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e",
    receipt_status: "confirmed",
  };

  const escrowAction: EscrowActionRecord = {
    action: "release",
    chain: "base_sepolia",
    contract_address: "0x1111111111111111111111111111111111111111",
    milestone_id: "milestone-001",
    amount: "100000000000000000",
    actor: "guardian-operator",
    tx_hash: "0x8f2d4e7b1a9c3d5e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e",
    receipt_status: "confirmed",
    policy_result: policyResult,
    created_at: "2026-09-10T08:45:00.000Z",
  };

  const policyChecks: PolicyCheckItem[] = [
    { name: "Approved Decision Gate", passed: true, details: "Guardian verified criteria with 95% confidence" },
    { name: "Escrow Funded on Base", passed: true, details: "0.10 ETH confirmed on Base Sepolia" },
    { name: "No Active Disputes", passed: true, details: "disputeOpen = false verified on-chain" },
    { name: "Evidence Provided", passed: true, details: "commit-def456 verified" },
    { name: "Amount Below Safety Cap", passed: true, details: "0.10 ETH <= 1.00 ETH max cap" },
    { name: "Contract Allowlisted", passed: true, details: "0x1111...1111 verified in allowlist" },
    { name: "Operator Confirmation", passed: true, details: "Explicit user confirmation granted" },
  ];

  return {
    id: "approved",
    title: "Milestone Verified: Base Sepolia Escrow Released",
    description: "Freelancer submits revised commit satisfying idempotency and retries. Guardian verifies history, deterministic policy validates on-chain safety gates, and funds are safely released.",
    sessionBadge: "SESSION 3 (RESOLUTION & RELEASE)",
    fixture,
    decision,
    policyResult,
    escrowAction,
    policyChecks,
  };
}

async function buildEscalatedScenario(): Promise<DemoScenario> {
  const decisionPath = resolve(SHARED_FIXTURES, "decision-escalate.json");
  const diskDecision = await readJsonFile<GuardianDecision>(decisionPath);

  const fixture: ReviewFixture = {
    project_id: "project-001",
    milestone_id: "milestone-001",
    acceptance_criteria: [
      "API requests must support retries",
      "API requests must be idempotent",
    ],
    feedback: [
      {
        id: "feedback-001",
        author: "backer-001",
        content: "Idempotency requirements need review.",
      },
    ],
    evidence: [
      {
        id: "commit-xyz789",
        type: "github_commit",
        locator: "https://github.com/example/project/commit/xyz789",
        summary: "Partial retry implementation.",
      },
    ],
    unresolved_issues: [
      {
        id: "issue-001",
        description: "Client and freelancer disagree on error response formats and rate limits.",
      },
    ],
  };

  const decision: GuardianDecision = diskDecision ?? {
    outcome: "escalate",
    rationale: "The project history contains unresolved issues or missing criteria that require human mediation before release.",
    confidence: 0.94,
    cited_memory_ids: ["issue-001", "criteria-001"],
    cited_evidence_ids: ["commit-xyz789"],
    missing_information: ["Client has not resolved the dispute regarding error formats."],
  };

  const policyResult: PolicyResult = {
    allowed: false,
    reason: "Open unresolved issues require human mediation; release blocked.",
    decision_outcome: "escalate",
    escrow_action: "escalate",
    transaction_hash: null,
    receipt_status: null,
  };

  const escrowAction: EscrowActionRecord = {
    action: "escalate",
    chain: "base_sepolia",
    contract_address: "0x1111111111111111111111111111111111111111",
    milestone_id: "milestone-001",
    amount: "100000000000000000",
    actor: "guardian-policy-gate",
    tx_hash: null,
    receipt_status: null,
    policy_result: policyResult,
    created_at: "2026-09-10T09:00:00.000Z",
  };

  const policyChecks: PolicyCheckItem[] = [
    { name: "Approved Decision Gate", passed: false, details: "Guardian escalated due to unresolved project issue" },
    { name: "Escrow Funded on Base", passed: true, details: "0.10 ETH locked in contract" },
    { name: "Dispute Status Check", passed: false, details: "Human review required by unresolved issue" },
    { name: "Amount Below Safety Cap", passed: true, details: "0.10 ETH <= 1.00 ETH limit" },
    { name: "Contract Allowlisted", passed: true, details: "0x1111...1111 valid" },
  ];

  return {
    id: "escalated",
    title: "Safety Invariant & Deletion: Human Escalation",
    description: "Demonstrates safety boundaries when memory detects conflicting feedback, open disputes, or when Sibyl Memory is wiped (deletion test), failing closed to protect escrow funds.",
    sessionBadge: "SAFETY & ESCALATION GATE",
    fixture,
    decision,
    policyResult,
    escrowAction,
    policyChecks,
  };
}

export function buildSimulatedScenario(params: SimulationParams = {}): DemoScenario {
  const commitSha = params.commitSha?.trim() || "commit-sim-" + Math.random().toString(36).slice(2, 8);
  const summary = params.summary?.trim() || "Custom deliverable code submitted for Guardian audit.";
  const hasRetries = params.hasRetries ?? true;
  const hasIdempotency = params.hasIdempotency ?? false;
  const hasDispute = params.hasDispute ?? false;
  const confidence = typeof params.confidence === "number" ? Math.min(1, Math.max(0, params.confidence)) : 0.94;

  let outcome: GuardianOutcome = "approve";
  let rationale = "";
  const missingInfo: string[] = [];

  if (hasDispute) {
    outcome = "escalate";
    rationale = "Milestone history contains an active dispute flag. Zero-trust invariant halts automated settlement to protect funds pending human stakeholder resolution.";
    missingInfo.push("Resolution of active milestone dispute by project stakeholders");
  } else if (!hasIdempotency) {
    outcome = "request_revision";
    rationale = `Submission (${commitSha}) implements API endpoints and retry logic, but fails to satisfy the stakeholder requirement for idempotency keys (feedback-001).`;
    missingInfo.push("Implementation of Idempotency-Key header on mutative HTTP routes");
  } else if (!hasRetries) {
    outcome = "request_revision";
    rationale = `Submission (${commitSha}) does not implement exponential retry handling as specified in acceptance criteria.`;
    missingInfo.push("Implementation of exponential backoff retry policy");
  } else {
    outcome = "approve";
    rationale = `Submission (${commitSha}) satisfies all recalled acceptance criteria and stakeholder feedback items. Retries and idempotency headers verified.`;
  }

  const allowed = outcome === "approve";
  const escrowActionType: EscrowActionType = outcome === "approve" ? "release" : outcome === "request_revision" ? "hold" : "escalate";
  const txHash = allowed
    ? "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    : null;

  const policyResult: PolicyResult = {
    allowed,
    reason: allowed
      ? "All deterministic policy checks passed; Base Sepolia escrow release authorized."
      : outcome === "escalate"
      ? "Active dispute locks escrow funds; manual escalation required."
      : "Guardian returned request_revision; funds remain safely locked in escrow.",
    decision_outcome: outcome,
    escrow_action: escrowActionType,
    transaction_hash: txHash,
    receipt_status: allowed ? "confirmed" : null,
  };

  const decision: GuardianDecision = {
    outcome,
    rationale,
    confidence,
    cited_memory_ids: ["crit-001", "crit-002", ...(hasDispute ? ["dispute-001"] : ["feedback-001"])],
    cited_evidence_ids: [commitSha],
    missing_information: missingInfo,
  };

  const fixture: ReviewFixture = {
    project_id: "project-001",
    milestone_id: "milestone-001",
    acceptance_criteria: [
      "API requests must support retries",
      "API requests must be idempotent",
    ],
    feedback: [
      {
        id: "feedback-001",
        author: "backer-001",
        content: "Please focus the next iteration on API architecture, retries, and idempotency.",
      },
    ],
    evidence: [
      {
        id: commitSha,
        type: "github_commit",
        locator: `https://github.com/example/project/commit/${commitSha.replace(/^commit-/, "")}`,
        summary,
        content_hash: `sha256:sim-${commitSha}`,
      },
    ],
    ...(hasDispute
      ? {
          unresolved_issues: [
            {
              id: "dispute-001",
              description: "Active stakeholder dispute: Client flagged unresolved scope difference.",
            },
          ],
        }
      : {}),
  };

  const policyChecks: PolicyCheckItem[] = [
    {
      name: "Approved Decision Gate",
      passed: outcome === "approve",
      details: outcome === "approve"
        ? `Guardian verified criteria with ${Math.round(confidence * 100)}% confidence`
        : `Guardian returned ${outcome}`,
    },
    {
      name: "Escrow Funded on Base",
      passed: true,
      details: "0.10 ETH confirmed locked in MilestoneEscrow",
    },
    {
      name: "No Active Disputes",
      passed: !hasDispute,
      details: hasDispute ? "FAIL: Active dispute flagged on milestone" : "disputeOpen = false verified on-chain",
    },
    {
      name: "Evidence Provided",
      passed: true,
      details: `${commitSha} verified and ingested`,
    },
    {
      name: "Amount Below Safety Cap",
      passed: true,
      details: "0.10 ETH <= 1.00 ETH maximum limit",
    },
    {
      name: "Contract Allowlisted",
      passed: true,
      details: "0x633FB55E57c8d93f77E09a130983d544ff875e76 verified",
    },
    {
      name: "Operator Confirmation",
      passed: allowed,
      details: allowed ? "Policy clearance confirmed" : "Skipped (approval check failed)",
    },
  ];

  const escrowAction: EscrowActionRecord = {
    action: escrowActionType,
    chain: "base_sepolia",
    contract_address: "0x633FB55E57c8d93f77E09a130983d544ff875e76",
    milestone_id: "milestone-001",
    amount: "100000000000000000",
    actor: "guardian-policy-gate",
    tx_hash: txHash,
    receipt_status: allowed ? "confirmed" : null,
    policy_result: policyResult,
    created_at: new Date().toISOString(),
  };

  return {
    id: "simulated",
    title: outcome === "approve"
      ? "Simulated Audit: Milestone Released on Base Sepolia"
      : outcome === "request_revision"
      ? "Simulated Audit: Revision Required Before Release"
      : "Simulated Audit: Human Escalation Gate Triggered",
    description: `Interactive sandbox test for deliverable ${commitSha}. Demonstrates dynamic Sibyl memory recall and deterministic zero-trust policy enforcement.`,
    sessionBadge: `SIMULATED RUN • ${outcome.toUpperCase().replace(/_/g, " ")}`,
    fixture,
    decision,
    policyResult,
    escrowAction,
    policyChecks,
  };
}
