import {
  badge,
  bold,
  bullet,
  checkmark,
  colored,
  dim,
  divider,
  formatTable,
  outcomeBadge,
  panel,
  tag,
} from "./formatters.js";
import type { DemoScenario, ReviewFixture, GuardianDecision, PolicyResult, EscrowActionRecord, PolicyCheckItem } from "./types.js";

export function renderScenario(scenario: DemoScenario): string {
  const sections: string[] = [];

  // Header Banner
  sections.push(renderBanner(scenario));

  // 1. Recalled Sibyl Context
  sections.push(renderRecalledContext(scenario.fixture));

  // 2. Deliverable Evidence
  sections.push(renderEvidence(scenario.fixture));

  // 3. Guardian AI Verdict (Advisory)
  sections.push(renderGuardianDecision(scenario.decision));

  // 4. Deterministic Policy Gate (Enforced)
  sections.push(renderPolicyGate(scenario.policyResult, scenario.policyChecks));

  // 5. Base Sepolia Escrow Execution
  sections.push(renderEscrowExecution(scenario.escrowAction));

  return sections.join("\n\n");
}

export function renderCompositeRun(
  fixture: ReviewFixture,
  decision: GuardianDecision,
  policyResult: PolicyResult,
  escrowAction: EscrowActionRecord,
  title = "Live Pipeline Evaluation",
): string {
  const sections: string[] = [];

  const bannerLines = [
    divider(),
    `  ${bold("MILESTONE-ESCROW GUARDIAN")} ${badge("LIVE RUN", "magenta")}`,
    `  ${bold("Project:")} ${fixture.project_id}   ${bold("Milestone:")} ${fixture.milestone_id}`,
    `  ${dim("Title:")} ${title}`,
    divider(),
  ];
  sections.push(bannerLines.join("\n"));

  sections.push(renderRecalledContext(fixture));
  sections.push(renderEvidence(fixture));
  sections.push(renderGuardianDecision(decision));

  const fallbackChecks: PolicyCheckItem[] = [
    { name: "Approved Decision Gate", passed: decision.outcome === "approve", details: `Outcome: ${decision.outcome}` },
    { name: "Policy Evaluation Allowed", passed: policyResult.allowed, details: policyResult.reason },
    { name: "Escrow Action Decided", passed: true, details: `Action: ${policyResult.escrow_action}` },
  ];
  sections.push(renderPolicyGate(policyResult, fallbackChecks));
  sections.push(renderEscrowExecution(escrowAction));

  return sections.join("\n\n");
}

function renderBanner(scenario: DemoScenario): string {
  const lines: string[] = [
    divider(),
    `  ${bold("MILESTONE-ESCROW GUARDIAN")} ${badge(scenario.sessionBadge, "blue")}`,
    `  ${bold("Scenario:")} ${colored(scenario.title, "cyan")}`,
    `  ${dim("Context:")} ${scenario.description}`,
    `  ${bold("Target:")} Project ${colored(scenario.fixture.project_id, "magenta")} • Milestone ${colored(scenario.fixture.milestone_id, "magenta")}`,
    divider(),
  ];
  return lines.join("\n");
}

function renderRecalledContext(fixture: ReviewFixture): string {
  const lines: string[] = [
    ` ${dim("Tier Mapping: HOT (Review State) | WARM (Project Entity) | REFERENCE (Criteria)")}`,
    "",
    ` ${bold("Acceptance Criteria Recalled:")}`,
    ...fixture.acceptance_criteria.map((crit, idx) => `   ${tag(`crit-00${idx + 1}`)} ${crit}`),
  ];

  if (fixture.feedback.length > 0) {
    lines.push("");
    lines.push(` ${bold("Stakeholder History & Feedback (COLD Tier Events):")}`);
    for (const item of fixture.feedback) {
      lines.push(`   ${tag(item.id)} ${bold(item.author)}: "${item.content}"`);
    }
  }

  if (fixture.unresolved_issues && fixture.unresolved_issues.length > 0) {
    lines.push("");
    lines.push(` ${bold(colored("Unresolved Issues on Record:", "red"))}`);
    for (const issue of fixture.unresolved_issues) {
      lines.push(`   ${tag(issue.id)} ${colored(issue.description, "yellow")}`);
    }
  }

  return panel("1. RECALLED SIBYL MEMORY CONTEXT", lines, "cyan");
}

function renderEvidence(fixture: ReviewFixture): string {
  const lines: string[] = [
    ` ${dim("Freelancer Deliverables Submitted for Milestone Review:")}`,
    "",
  ];

  for (const item of fixture.evidence) {
    lines.push(` ${tag(item.id)} ${bold(item.type)}: ${item.summary}`);
    lines.push(`   ${dim("Locator:")} ${colored(item.locator, "blue")}`);
    if (item.content_hash) {
      lines.push(`   ${dim("Hash:")}    ${dim(item.content_hash)}`);
    }
  }

  return panel("2. SUBMITTED EVIDENCE", lines, "magenta");
}

function renderGuardianDecision(decision: GuardianDecision): string {
  const confidencePercent = Math.round(decision.confidence * 100);
  const badgeStr = outcomeBadge(decision.outcome);

  const lines: string[] = [
    ` ${dim("AI Reasoning Provider: Evaluates Deliverables against Scoped Sibyl History")}`,
    "",
    ` ${bold("Guardian Verdict:")}    ${badgeStr}  ${dim(`(Confidence: ${confidencePercent}%)`)}`,
    ` ${bold("Rationale:")}           ${decision.rationale}`,
    "",
    ` ${bold("Cited Memories:")}      ${[...new Set(decision.cited_memory_ids)].map(tag).join(" ") || dim("None")}`,
    ` ${bold("Cited Evidence:")}      ${[...new Set(decision.cited_evidence_ids)].map(tag).join(" ") || dim("None")}`,
  ];

  if (decision.missing_information.length > 0) {
    lines.push("");
    lines.push(` ${bold(colored("Missing Information / Gaps Identified:", "yellow"))}`);
    for (const gap of decision.missing_information) {
      lines.push(`   ${colored("•", "yellow")} ${gap}`);
    }
  }

  return panel("3. GUARDIAN AI JUDGMENT [Advisory - Cannot Move Funds]", lines, "yellow");
}

function renderPolicyGate(policyResult: PolicyResult, checks: PolicyCheckItem[]): string {
  const statusBadge = policyResult.allowed ? badge("POLICY PASS", "green") : badge("RELEASE BLOCKED", "red");

  const lines: string[] = [
    ` ${dim("Deterministic Invariant: Model output NEVER moves money directly.")}`,
    ` ${dim("Code validates schema -> on-chain facts -> cap -> allowlist -> confirmation.")}`,
    "",
    ` ${bold("Gate Verdict:")}        ${statusBadge}  ${bold("Escrow Action:")} ${colored(policyResult.escrow_action.toUpperCase(), policyResult.allowed ? "green" : "yellow")}`,
    ` ${bold("Safety Reason:")}       ${policyResult.reason}`,
    "",
    ` ${bold("Deterministic Safety Checks:")}`,
    ...checks.map((c) => `   ${checkmark(c.passed)} ${bold(c.name)}: ${dim(c.details)}`),
  ];

  return panel("4. DETERMINISTIC SAFETY POLICY [Enforced Invariant]", lines, policyResult.allowed ? "green" : "red");
}

function renderEscrowExecution(record: EscrowActionRecord): string {
  const weiToEth = (BigInt(record.amount) / 10n ** 18n).toString() + "." + ((BigInt(record.amount) % 10n ** 18n) / 10n ** 16n).toString().padStart(2, "0");

  const lines: string[] = [
    ` ${dim("Smart Contract: MilestoneEscrow.sol (Native ETH) on Base Sepolia")}`,
    "",
    bullet("Action Taken", colored(record.action.toUpperCase(), record.action === "release" ? "green" : "yellow")),
    bullet("Chain Target", `${bold(record.chain)} (Chain ID 84532)`),
    bullet("Contract Addr", record.contract_address),
    bullet("Locked Amount", `${weiToEth} ETH (${record.amount} wei)`),
    bullet("Executed By", record.actor),
  ];

  if (record.tx_hash) {
    lines.push(bullet("Transaction", colored(record.tx_hash, "cyan")));
    lines.push(bullet("Explorer URL", colored(`https://sepolia.basescan.org/tx/${record.tx_hash}`, "blue")));
    lines.push(bullet("Receipt Status", badge(record.receipt_status?.toUpperCase() ?? "CONFIRMED", "green")));
  } else {
    lines.push(bullet("Transaction", dim("None (Funds remain safely secured in escrow contract)")));
    lines.push(bullet("Receipt Status", dim("Not Triggered")));
  }

  lines.push(bullet("Timestamp", dim(record.created_at)));

  return panel("5. BASE SEPOLIA ESCROW EXECUTION", lines, record.action === "release" ? "green" : "blue");
}
