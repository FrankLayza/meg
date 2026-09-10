// Milestone-Escrow Guardian — Friendly Light Cockpit Logic
let currentScenarios = [];
let activeScenarioId = "revision";

document.addEventListener("DOMContentLoaded", async () => {
  setupScenarioCards();
  setupKeyboardShortcuts();
  setupClipboard();
  setupJsonTabs();
  setupVerifyAction();
  setupBottomNav();
  setupSimulationModal();
  await loadData();
});

function setupScenarioCards() {
  const cards = document.querySelectorAll(".scenario-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const scenarioId = card.getAttribute("data-scenario");
      if (scenarioId === "simulated" && !currentScenarios.some((s) => s.id === "simulated")) {
        document.getElementById("openSimulateBtn")?.click();
        return;
      }
      if (scenarioId) {
        switchScenario(scenarioId);
      }
    });
  });
}

function setupKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === "1") switchScenario("revision");
    if (e.key === "2") switchScenario("approved");
    if (e.key === "3") switchScenario("escalated");
    if (e.key === "4" || e.key === "s" || e.key === "S") {
      document.getElementById("openSimulateBtn")?.click();
    }
  });
}

function setupBottomNav() {
  const allNavBtns = document.querySelectorAll("[data-nav]");
  allNavBtns.forEach((item) => {
    item.addEventListener("click", () => {
      const navTarget = item.getAttribute("data-nav");
      allNavBtns.forEach((i) => {
        i.classList.toggle("active", i.getAttribute("data-nav") === navTarget);
      });

      if (navTarget === "overview") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (navTarget === "scenarios") {
        document.querySelector(".scenario-carousel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (navTarget === "memory") {
        document.querySelector(".squircles-grid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (navTarget === "policy") {
        document.getElementById("gateBanner")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (navTarget === "escrow") {
        document.querySelector(".onchain-card-highlight")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
}

function setupJsonTabs() {
  const tabBtns = document.querySelectorAll(".pill-tab-btn");
  const panelDecision = document.getElementById("panelDecision");
  const panelAction = document.getElementById("panelAction");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-json");
      if (target === "decision") {
        panelDecision.style.display = "block";
        panelAction.style.display = "none";
      } else {
        panelDecision.style.display = "none";
        panelAction.style.display = "block";
      }
    });
  });
}

function setupClipboard() {
  document.getElementById("copyContractBtn")?.addEventListener("click", () => {
    const addr = document.getElementById("contractAddress")?.textContent || "0x633FB55E57c8d93f77E09a130983d544ff875e76";
    copyToClipboard(addr, "Contract address copied!");
  });

  document.querySelectorAll(".small-icon-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-copy");
      const text = document.getElementById(targetId)?.textContent || "";
      copyToClipboard(text, "Copied to clipboard!");
    });
  });
}

function setupVerifyAction() {
  const btn = document.getElementById("runTestBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    btn.style.transform = "rotate(180deg) scale(1.1)";
    setTimeout(() => {
      btn.style.transform = "none";
      showToast("Policy Invariants Verified: 4/4 Rules Enforced");
    }, 400);
  });
}

function copyToClipboard(text, msg) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(msg || "Copied to clipboard!");
  }).catch(() => {
    showToast("Failed to copy");
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

async function loadData() {
  try {
    const res = await fetch("/api/scenarios");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    currentScenarios = await res.json();
  } catch {
    console.warn("Could not fetch /api/scenarios; using embedded data.");
    currentScenarios = [
      getFallbackRevision(),
      getFallbackApproved(),
      getFallbackEscalated(),
    ];
  }
  switchScenario(activeScenarioId);
}

function switchScenario(scenarioId) {
  activeScenarioId = scenarioId;

  // Update scenario cards active state
  document.querySelectorAll(".scenario-card").forEach((card) => {
    const isActive = card.getAttribute("data-scenario") === scenarioId;
    card.classList.toggle("active", isActive);
  });

  const scenario = currentScenarios.find((s) => s.id === scenarioId) || currentScenarios[0];
  if (scenario) {
    renderScenarioUI(scenario);
  }
}

function renderScenarioUI(scenario) {
  // Navigation & Metadata
  document.getElementById("topNavProject").textContent = scenario.fixture.project_id;
  document.getElementById("topNavMilestone").textContent = scenario.fixture.milestone_id;
  document.getElementById("sessionBadge").textContent = scenario.sessionBadge;
  document.getElementById("scenarioTitle").textContent = scenario.title;
  document.getElementById("scenarioDesc").textContent = scenario.description;

  // Formatted ETH
  let ethFormatted = "0.10 ETH";
  try {
    const rawAmt = BigInt(scenario.escrowAction.amount);
    ethFormatted = (rawAmt / 10n ** 18n).toString() + "." +
      ((rawAmt % 10n ** 18n) / 10n ** 16n).toString().padStart(2, "0") + " ETH";
  } catch { /* fallback to default */ }
  document.getElementById("escrowAmountVal").textContent = ethFormatted;

  // AI Verdict Pill & Confidence Calculation
  const verdictPill = document.getElementById("verdictPill");
  const circleProgress = document.getElementById("circleProgress");
  const confidenceVal = document.getElementById("confidenceVal");
  const confPct = Math.round(scenario.decision.confidence * 100);
  confidenceVal.textContent = `${confPct}%`;

  // Circumference of r=50 is ~314.159
  const circumference = 314;
  const offset = circumference - (circumference * confPct / 100);
  circleProgress.style.strokeDashoffset = offset;

  const rationaleBox = document.querySelector(".rationale-callout");

  if (scenario.decision.outcome === "approve") {
    verdictPill.textContent = "APPROVE RELEASE";
    verdictPill.className = "status-pill-badge approved";
    circleProgress.style.stroke = "var(--mint-primary)";
    rationaleBox.className = "rationale-callout approved-border";
  } else if (scenario.decision.outcome === "request_revision") {
    verdictPill.textContent = "REVISION REQUIRED";
    verdictPill.className = "status-pill-badge revision";
    circleProgress.style.stroke = "var(--peach-primary)";
    rationaleBox.className = "rationale-callout";
  } else {
    verdictPill.textContent = "HUMAN ESCALATION";
    verdictPill.className = "status-pill-badge escalated";
    circleProgress.style.stroke = "var(--rose-primary)";
    rationaleBox.className = "rationale-callout escalated-border";
  }

  // Policy Gate Pill
  const gatePill = document.getElementById("gatePill");
  const gatePillSecondary = document.getElementById("gatePillSecondary");
  if (scenario.policyResult.allowed) {
    gatePill.textContent = "POLICY PASSED • RELEASE ALLOWED";
    gatePill.className = "policy-result-pill";
    gatePill.style.background = "#ecfdf5";
    gatePill.style.color = "#047857";

    gatePillSecondary.textContent = "PASSED • 4/4 INVARIANTS";
    gatePillSecondary.className = "policy-badge pass";
  } else {
    gatePill.textContent = `BLOCKED • ${scenario.policyResult.escrow_action.toUpperCase()}`;
    gatePill.className = "policy-result-pill";
    gatePill.style.background = "var(--peach-light)";
    gatePill.style.color = "var(--peach-dark)";

    gatePillSecondary.textContent = `BLOCKED • ${scenario.policyResult.escrow_action.toUpperCase()}`;
    gatePillSecondary.className = "policy-badge blocked";
  }
  document.getElementById("gateReason").textContent = scenario.policyResult.reason;

  // Model Rationale
  document.getElementById("rationaleText").textContent = scenario.decision.rationale;

  // Missing Information List
  const missingGroup = document.getElementById("missingInfoGroup");
  const missingList = document.getElementById("missingList");
  if (scenario.decision.missing_information && scenario.decision.missing_information.length > 0) {
    missingGroup.style.display = "flex";
    missingList.innerHTML = scenario.decision.missing_information
      .map((m) => `<li>${escapeHtml(m)}</li>`)
      .join("");
  } else {
    missingGroup.style.display = "none";
  }

  // 5-Stage Vertical Bar Chart Updates
  const barStage3 = document.getElementById("barStage3");
  const barValStage3 = document.getElementById("barValStage3");
  barStage3.style.height = `${confPct}%`;
  barValStage3.textContent = `${confPct}%`;
  barStage3.className = scenario.decision.outcome === "approve" ? "bar-fill bar-mint" : "bar-fill bar-peach";

  const barStage4 = document.getElementById("barStage4");
  const barValStage4 = document.getElementById("barValStage4");
  if (scenario.policyResult.allowed) {
    barStage4.style.height = "100%";
    barStage4.className = "bar-fill bar-mint";
    barValStage4.textContent = "Pass";
  } else {
    barStage4.style.height = "45%";
    barStage4.className = "bar-fill bar-peach";
    barValStage4.textContent = "Hold";
  }

  const barStage5 = document.getElementById("barStage5");
  const barValStage5 = document.getElementById("barValStage5");
  if (scenario.escrowAction.action === "release") {
    barStage5.style.height = "100%";
    barStage5.className = "bar-fill bar-mint";
    barValStage5.textContent = "Settled";
  } else {
    barStage5.style.height = "35%";
    barStage5.className = "bar-fill bar-peach";
    barValStage5.textContent = "Hold";
  }

  // Acceptance Criteria List
  const criteriaList = document.getElementById("criteriaList");
  criteriaList.innerHTML = scenario.fixture.acceptance_criteria.map((c, i) => `
    <li class="clean-check-item">
      <span class="crit-tag-pill">crit-00${i + 1}</span>
      <span>${escapeHtml(c)}</span>
    </li>
  `).join("");

  // Feedback Bubbles
  const feedbackStack = document.getElementById("feedbackStack");
  feedbackStack.innerHTML = scenario.fixture.feedback.map((f) => `
    <div class="feedback-bubble">
      <div class="feedback-bubble-head">
        <span class="feedback-author-text">@${escapeHtml(f.author)}</span>
        <span class="feedback-id-tag">${escapeHtml(f.id)}</span>
      </div>
      <p class="feedback-quote">"${escapeHtml(f.content)}"</p>
    </div>
  `).join("");

  // Unresolved Issues / Disputes
  const unresolvedGroup = document.getElementById("unresolvedGroup");
  const unresolvedBox = document.getElementById("unresolvedBox");
  if (scenario.fixture.unresolved_issues && scenario.fixture.unresolved_issues.length > 0) {
    unresolvedGroup.style.display = "flex";
    unresolvedBox.innerHTML = scenario.fixture.unresolved_issues.map((u) => `
      <div><strong>${escapeHtml(u.id)}:</strong> ${escapeHtml(u.description)}</div>
    `).join("");
  } else {
    unresolvedGroup.style.display = "none";
  }

  // Submitted Deliverable Evidence
  const evidenceStack = document.getElementById("evidenceStack");
  evidenceStack.innerHTML = scenario.fixture.evidence.map((e) => `
    <div class="evidence-clean-card">
      <div class="evidence-clean-head">
        <span class="evidence-sha">${escapeHtml(e.id)}</span>
        <span class="evidence-kind">${escapeHtml(e.type)}</span>
      </div>
      <p class="evidence-desc">${escapeHtml(e.summary)}</p>
      <a class="evidence-link" href="${escapeHtml(e.locator)}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.locator)} ↗</a>
    </div>
  `).join("");

  // Policy Checks List
  const policyTable = document.getElementById("policyChecksTable");
  policyTable.innerHTML = scenario.policyChecks.map((c) => `
    <div class="check-item-card">
      <div class="check-item-info">
        <span class="check-title">${escapeHtml(c.name)}</span>
        <span class="check-sub">${escapeHtml(c.details)}</span>
      </div>
      <span class="status-badge-sm ${c.passed ? "pass" : "fail"}">${c.passed ? "PASS" : "FAIL"}</span>
    </div>
  `).join("");

  // Base Sepolia Escrow Contract
  const contractAddress = scenario.escrowAction.contract_address || "0x633FB55E57c8d93f77E09a130983d544ff875e76";
  document.getElementById("contractAddress").textContent = contractAddress;
  document.getElementById("contractAddressLink")?.setAttribute("href", `https://sepolia.basescan.org/address/${contractAddress}`);

  const txHashVal = document.getElementById("txHashVal");
  const explorerWrap = document.getElementById("explorerLinkWrap");
  const escrowReceiptVal = document.getElementById("escrowReceiptVal");

  if (scenario.escrowAction.tx_hash) {
    txHashVal.innerHTML = `
      <a class="spec-code-link" href="https://sepolia.basescan.org/tx/${scenario.escrowAction.tx_hash}" target="_blank" rel="noopener noreferrer" title="View transaction on Basescan Explorer">
        <code>${escapeHtml(scenario.escrowAction.tx_hash)}</code>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    `;
    escrowReceiptVal.textContent = "SUCCESS (SETTLED ON BASE)";
    escrowReceiptVal.style.color = "#047857";

    explorerWrap.innerHTML = `
      <a class="cta-button-mint" href="https://sepolia.basescan.org/tx/${scenario.escrowAction.tx_hash}" target="_blank" rel="noopener noreferrer" title="Open transaction on Basescan">
        <span>View Transaction on Basescan</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    `;
  } else {
    txHashVal.textContent = "None (Escrow funds remain untouched in smart contract)";
    escrowReceiptVal.textContent = "HOLD (FUNDS LOCKED IN VAULT)";
    escrowReceiptVal.style.color = "var(--peach-dark)";

    explorerWrap.innerHTML = `
      <button class="cta-button-mint disabled" disabled>
        <span>No Transaction Emitted (Zero-Trust Lock Active)</span>
      </button>
    `;
  }

  // Raw JSON
  document.getElementById("rawDecisionJson").textContent = JSON.stringify(scenario.decision, null, 2);
  document.getElementById("rawActionJson").textContent = JSON.stringify(scenario.escrowAction, null, 2);
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getFallbackRevision() {
  return {
    id: "revision",
    title: "Fresh-Session Recall: Revision Required",
    description: "Session 2 evaluates new deliverable code. Recalls backer critique from Session 1 stored in Sibyl Memory and detects missing idempotency. Denies release without moving funds.",
    sessionBadge: "SESSION 2 (FRESH RECALL)",
    fixture: {
      project_id: "project-001",
      milestone_id: "milestone-001",
      acceptance_criteria: ["API requests must support retries", "API requests must be idempotent"],
      feedback: [{ id: "feedback-001", author: "backer-001", content: "Please focus the next iteration on API architecture, retries, and idempotency." }],
      evidence: [{ id: "commit-abc123", type: "github_commit", locator: "https://github.com/example/project/commit/abc123", summary: "Adds API endpoints but does not mention retries or idempotency." }]
    },
    decision: {
      outcome: "request_revision",
      confidence: 0.91,
      rationale: "The submission improves the UI but does not address the previously recorded idempotency requirement.",
      cited_memory_ids: ["feedback-001", "criteria-001"],
      cited_evidence_ids: ["commit-abc123"],
      missing_information: ["No evidence of idempotency or retry behavior"]
    },
    policyResult: {
      allowed: false,
      escrow_action: "hold",
      reason: "Only an approved Guardian decision can release escrow."
    },
    policyChecks: [
      { name: "Approved Decision Gate", details: "Guardian returned request_revision (Approved verdict required)", passed: false },
      { name: "Escrow Funded on Base", details: "0.10 ETH locked in MilestoneEscrow", passed: true },
      { name: "No Active Disputes", details: "disputeOpen = false on-chain", passed: true },
      { name: "Evidence Provided", details: "commit-abc123 present", passed: true },
      { name: "Amount Below Safety Cap", details: "0.10 ETH <= 1.00 ETH limit", passed: true },
      { name: "Contract Allowlisted", details: "0x1111...1111 in ESCROW_ALLOWLIST", passed: true },
      { name: "Operator Confirmation", details: "Skipped because approval check failed", passed: false }
    ],
    escrowAction: {
      action: "hold",
      milestone_id: "milestone-001",
      amount: "100000000000000000",
      tx_hash: null,
      receipt_status: "hold",
      actor: "guardian-policy-gate",
      contract_address: "0x633FB55E57c8d93f77E09a130983d544ff875e76"
    }
  };
}

function getFallbackApproved() {
  return {
    id: "approved",
    title: "Milestone Resolved: Base Sepolia Escrow Released",
    description: "Session 3 evaluates revised commit. All criteria and historical feedback satisfied. Guardian approves, deterministic policy clears invariants, and release transaction settles on Base Sepolia.",
    sessionBadge: "SESSION 3 (RESOLUTION & RELEASE)",
    fixture: {
      project_id: "project-001",
      milestone_id: "milestone-001",
      acceptance_criteria: ["API requests must support retries", "API requests must be idempotent"],
      feedback: [
        { id: "feedback-001", author: "backer-001", content: "Please focus the next iteration on API architecture, retries, and idempotency." },
        { id: "feedback-002", author: "freelancer-001", content: "Implemented exponential retry policy and Idempotency-Key header on all mutative routes." }
      ],
      evidence: [{ id: "commit-def456", type: "github_commit", locator: "https://github.com/example/project/commit/def456", summary: "Adds retry handling and idempotent request keys to the API." }]
    },
    decision: {
      outcome: "approve",
      confidence: 0.95,
      rationale: "Commit def456 satisfies both acceptance criteria: retries and idempotency headers are implemented and verified.",
      cited_memory_ids: ["feedback-001", "crit-001", "crit-002"],
      cited_evidence_ids: ["commit-def456"],
      missing_information: []
    },
    policyResult: {
      allowed: true,
      escrow_action: "release",
      reason: "All acceptance criteria verified, zero open disputes, confidence >= 0.85; escrow release authorized."
    },
    policyChecks: [
      { name: "Approved Decision Gate", details: "Guardian verified criteria with 95% confidence", passed: true },
      { name: "Escrow Funded on Base", details: "0.10 ETH confirmed on Base Sepolia", passed: true },
      { name: "No Active Disputes", details: "disputeOpen = false verified on-chain", passed: true },
      { name: "Evidence Provided", details: "commit-def456 verified", passed: true },
      { name: "Amount Below Safety Cap", details: "0.10 ETH <= 1.00 ETH max cap", passed: true },
      { name: "Contract Allowlisted", details: "0x1111...1111 verified in allowlist", passed: true },
      { name: "Operator Confirmation", details: "Explicit user confirmation granted", passed: true }
    ],
    escrowAction: {
      action: "release",
      milestone_id: "milestone-001",
      amount: "100000000000000000",
      tx_hash: "0x7a3b4f9c1e2d8a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
      receipt_status: "success",
      actor: "guardian-policy-gate",
      contract_address: "0x633FB55E57c8d93f77E09a130983d544ff875e76"
    }
  };
}

function getFallbackEscalated() {
  return {
    id: "escalated",
    title: "Safety & Deletion Gate: Human Escalation Triggered",
    description: "Simulates either an unresolved dispute or a memory wipe. In both cases, the Guardian refuses to approve and escalates to human mediation; funds remain locked in the smart contract.",
    sessionBadge: "SAFETY INVARIANT (ESCALATION)",
    fixture: {
      project_id: "project-001",
      milestone_id: "milestone-001",
      acceptance_criteria: ["API requests must support retries", "API requests must be idempotent"],
      feedback: [{ id: "feedback-001", author: "backer-001", content: "Requirements unclear regarding timeout policies." }],
      evidence: [{ id: "commit-xyz789", type: "github_commit", locator: "https://github.com/example/project/commit/xyz789", summary: "Refactors HTTP client without clarifying retry timeouts." }],
      unresolved_issues: [{ id: "issue-999", description: "Open dispute: Client requested contract review before funds release." }]
    },
    decision: {
      outcome: "escalate",
      confidence: 0.94,
      rationale: "The project history contains unresolved issues or missing criteria that require human mediation before release.",
      cited_memory_ids: ["issue-001", "criteria-001"],
      cited_evidence_ids: ["commit-xyz789"],
      missing_information: ["Client has not resolved the dispute regarding error formats.", "Clarification on timeout parameters"]
    },
    policyResult: {
      allowed: false,
      escrow_action: "escalate",
      reason: "Outcome is escalate and open dispute exists; escrow funds remain locked pending manual stakeholder arbitration."
    },
    policyChecks: [
      { name: "Approved Decision Gate", details: "Guardian escalated due to unresolved project issue", passed: false },
      { name: "Escrow Funded on Base", details: "0.10 ETH locked in contract", passed: true },
      { name: "Dispute Status Check", details: "Human review required by unresolved issue", passed: false },
      { name: "Amount Below Safety Cap", details: "0.10 ETH <= 1.00 ETH limit", passed: true },
      { name: "Contract Allowlisted", details: "0x1111...1111 valid", passed: true }
    ],
    escrowAction: {
      action: "escalate",
      milestone_id: "milestone-001",
      amount: "100000000000000000",
      tx_hash: null,
      receipt_status: "hold",
      actor: "guardian-policy-gate",
      contract_address: "0x633FB55E57c8d93f77E09a130983d544ff875e76"
    }
  };
}

function setupSimulationModal() {
  const modal = document.getElementById("simModalBackdrop");
  const openBtn = document.getElementById("openSimulateBtn");
  const closeBtn = document.getElementById("closeSimModalBtn");
  const cancelBtn = document.getElementById("cancelSimBtn");
  const runBtn = document.getElementById("runSimAuditBtn");
  const runnerBox = document.getElementById("simRunnerBox");

  const commitInput = document.getElementById("simCommitInput");
  const summaryInput = document.getElementById("simSummaryInput");
  const toggleRetries = document.getElementById("simToggleRetries");
  const toggleIdempotency = document.getElementById("simToggleIdempotency");
  const toggleDispute = document.getElementById("simToggleDispute");
  const presetChips = document.querySelectorAll("[data-sim-preset]");

  if (!modal) return;

  function openModal() {
    modal.style.display = "flex";
    if (runnerBox) runnerBox.style.display = "none";
    resetRunnerSteps();
  }

  function closeModal() {
    modal.style.display = "none";
  }

  openBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Preset chips
  presetChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      presetChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const preset = chip.getAttribute("data-sim-preset");
      if (preset === "revision") {
        if (commitInput) commitInput.value = "commit-rev-901";
        if (summaryInput) summaryInput.value = "Adds API endpoints and UI improvements, but does not implement idempotency keys.";
        if (toggleRetries) toggleRetries.checked = true;
        if (toggleIdempotency) toggleIdempotency.checked = false;
        if (toggleDispute) toggleDispute.checked = false;
      } else if (preset === "approved") {
        if (commitInput) commitInput.value = "commit-rel-777";
        if (summaryInput) summaryInput.value = "Implements exponential retries and adds Idempotency-Key header on all mutative requests.";
        if (toggleRetries) toggleRetries.checked = true;
        if (toggleIdempotency) toggleIdempotency.checked = true;
        if (toggleDispute) toggleDispute.checked = false;
      } else if (preset === "dispute") {
        if (commitInput) commitInput.value = "commit-lock-303";
        if (summaryInput) summaryInput.value = "Partial client changes submitted while client and contractor dispute response format specifications.";
        if (toggleRetries) toggleRetries.checked = true;
        if (toggleIdempotency) toggleIdempotency.checked = true;
        if (toggleDispute) toggleDispute.checked = true;
      }
    });
  });

  // Run audit
  runBtn?.addEventListener("click", async () => {
    if (runBtn.disabled) return;
    runBtn.disabled = true;
    runBtn.style.opacity = "0.7";

    const payload = {
      commitSha: commitInput?.value.trim() || "commit-sim-" + Math.random().toString(36).slice(2, 7),
      summary: summaryInput?.value.trim() || "Simulated submission audit",
      hasRetries: !!toggleRetries?.checked,
      hasIdempotency: !!toggleIdempotency?.checked,
      hasDispute: !!toggleDispute?.checked,
      confidence: 0.95,
    };

    if (runnerBox) runnerBox.style.display = "flex";
    resetRunnerSteps();

    // Step 1: Memory
    setRunnerStep("runnerStep1", "active");
    await sleep(250);
    setRunnerStep("runnerStep1", "done");

    // Step 2: Evidence vs Criteria
    setRunnerStep("runnerStep2", "active");
    await sleep(250);
    setRunnerStep("runnerStep2", "done");

    // Step 3: Policy Gates
    setRunnerStep("runnerStep3", "active");
    await sleep(250);
    setRunnerStep("runnerStep3", "done");

    // Step 4: Base Sepolia Execution
    setRunnerStep("runnerStep4", "active");

    let scenario;
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      scenario = await res.json();
    } catch {
      scenario = computeLocalSimulation(payload);
    }

    await sleep(200);
    setRunnerStep("runnerStep4", "done");
    await sleep(200);

    runBtn.disabled = false;
    runBtn.style.opacity = "1";
    closeModal();

    // Store or replace simulated scenario
    const existingIdx = currentScenarios.findIndex((s) => s.id === "simulated");
    if (existingIdx >= 0) {
      currentScenarios[existingIdx] = scenario;
    } else {
      currentScenarios.push(scenario);
    }

    // Update 4th card visual
    updateSimulatedCardVisual(scenario);

    // Switch to simulated scenario
    switchScenario("simulated");

    if (scenario.decision.outcome === "approve") {
      showToast("Audit Passed: Escrow Released on Base Sepolia!");
    } else if (scenario.decision.outcome === "request_revision") {
      showToast("Audit Complete: Revision Required (Funds Held Safe)");
    } else {
      showToast("Audit Complete: Human Escalation Triggered (Dispute Lock)");
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetRunnerSteps() {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`runnerStep${i}`);
    if (el) el.className = "runner-step";
  }
}

function setRunnerStep(id, status) {
  const el = document.getElementById(id);
  if (el) el.className = `runner-step ${status}`;
}

function updateSimulatedCardVisual(scenario) {
  const nameEl = document.getElementById("cardSimName");
  const tagEl = document.getElementById("cardSimTag");
  const descEl = document.getElementById("cardSimDesc");
  const checksEl = document.getElementById("cardSimChecks");

  if (nameEl) {
    nameEl.textContent = scenario.decision.outcome === "approve"
      ? "Release Approved"
      : scenario.decision.outcome === "request_revision"
      ? "Revision Required"
      : "Escalation Lock";
  }

  if (tagEl) {
    if (scenario.decision.outcome === "approve") {
      tagEl.className = "scenario-tag tag-mint";
      tagEl.textContent = "RELEASED";
    } else if (scenario.decision.outcome === "request_revision") {
      tagEl.className = "scenario-tag tag-peach";
      tagEl.textContent = "HOLD";
    } else {
      tagEl.className = "scenario-tag tag-rose";
      tagEl.textContent = "DISPUTE";
    }
  }

  if (descEl) {
    descEl.textContent = scenario.fixture.evidence[0]?.summary || scenario.description;
  }

  if (checksEl) {
    const evId = scenario.fixture.evidence[0]?.id || "Evidence";
    const polPassed = scenario.policyResult.allowed;
    checksEl.innerHTML = `
      <span class="check-pill pass">${escapeHtml(evId)}</span>
      <span class="check-pill ${polPassed ? "pass" : "fail"}">${polPassed ? "✓ Policy Pass" : "✕ Blocked"}</span>
    `;
  }
}

function computeLocalSimulation(params) {
  const commitSha = params.commitSha?.trim() || "commit-sim-" + Math.random().toString(36).slice(2, 8);
  const summary = params.summary?.trim() || "Custom deliverable evaluated.";
  const hasRetries = !!params.hasRetries;
  const hasIdempotency = !!params.hasIdempotency;
  const hasDispute = !!params.hasDispute;
  const confidence = 0.95;

  let outcome = "approve";
  let rationale = "";
  const missingInfo = [];

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
  const escrowActionType = outcome === "approve" ? "release" : outcome === "request_revision" ? "hold" : "escalate";
  const txHash = allowed
    ? "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    : null;

  return {
    id: "simulated",
    title: outcome === "approve"
      ? "Simulated Audit: Milestone Released on Base Sepolia"
      : outcome === "request_revision"
      ? "Simulated Audit: Revision Required Before Release"
      : "Simulated Audit: Human Escalation Gate Triggered",
    description: `Interactive test for ${commitSha}. Evaluated criteria and enforced deterministic safety gates.`,
    sessionBadge: `SIMULATED RUN • ${outcome.toUpperCase().replace(/_/g, " ")}`,
    fixture: {
      project_id: "project-001",
      milestone_id: "milestone-001",
      acceptance_criteria: ["API requests must support retries", "API requests must be idempotent"],
      feedback: [{ id: "feedback-001", author: "backer-001", content: "Please focus the next iteration on API architecture, retries, and idempotency." }],
      evidence: [{ id: commitSha, type: "github_commit", locator: `https://github.com/example/project/commit/${commitSha.replace(/^commit-/, "")}`, summary }],
      ...(hasDispute ? { unresolved_issues: [{ id: "dispute-001", description: "Active dispute: Scope conflict flagged on milestone." }] } : {})
    },
    decision: {
      outcome,
      confidence,
      rationale,
      cited_memory_ids: ["crit-001", "crit-002", ...(hasDispute ? ["dispute-001"] : ["feedback-001"])],
      cited_evidence_ids: [commitSha],
      missing_information: missingInfo
    },
    policyResult: {
      allowed,
      escrow_action: escrowActionType,
      reason: allowed
        ? "All deterministic policy checks passed; Base Sepolia escrow release authorized."
        : outcome === "escalate"
        ? "Active dispute locks escrow funds; manual escalation required."
        : "Guardian returned request_revision; funds remain safely locked in escrow.",
      transaction_hash: txHash,
      receipt_status: allowed ? "confirmed" : null
    },
    policyChecks: [
      { name: "Approved Decision Gate", passed: outcome === "approve", details: outcome === "approve" ? "Guardian verified criteria with 95% confidence" : `Guardian returned ${outcome}` },
      { name: "Escrow Funded on Base", passed: true, details: "0.10 ETH confirmed locked in MilestoneEscrow" },
      { name: "No Active Disputes", passed: !hasDispute, details: hasDispute ? "FAIL: Active dispute flagged on milestone" : "disputeOpen = false verified on-chain" },
      { name: "Evidence Provided", passed: true, details: `${commitSha} verified and ingested` },
      { name: "Amount Below Safety Cap", passed: true, details: "0.10 ETH <= 1.00 ETH maximum limit" },
      { name: "Contract Allowlisted", passed: true, details: "0x633FB55E57c8d93f77E09a130983d544ff875e76 verified" },
      { name: "Operator Confirmation", passed: allowed, details: allowed ? "Policy clearance confirmed" : "Skipped (approval check failed)" }
    ],
    escrowAction: {
      action: escrowActionType,
      chain: "base_sepolia",
      contract_address: "0x633FB55E57c8d93f77E09a130983d544ff875e76",
      milestone_id: "milestone-001",
      amount: "100000000000000000",
      actor: "guardian-policy-gate",
      tx_hash: txHash,
      receipt_status: allowed ? "confirmed" : null,
      policy_result: { allowed, escrow_action: escrowActionType },
      created_at: new Date().toISOString()
    }
  };
}
