import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { bold, colored, divider } from "./formatters.js";
import { renderCompositeRun, renderScenario } from "./renderer.js";
import { loadAllScenarios, loadScenario } from "./scenarios.js";
import type {
  DemoScenarioId,
  EscrowActionRecord,
  GuardianDecision,
  PolicyResult,
  ReviewFixture,
} from "./types.js";

interface CliOptions {
  scenario?: string;
  walkthrough: boolean;
  decision?: string;
  policy?: string;
  fixture?: string;
  reset: boolean;
  help: boolean;
}

const parsed = parseArgs({
  options: {
    scenario: { type: "string", short: "s" },
    walkthrough: { type: "boolean", short: "w" },
    decision: { type: "string", short: "d" },
    policy: { type: "string", short: "p" },
    fixture: { type: "string", short: "f" },
    reset: { type: "boolean", short: "r" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
});

const args: CliOptions = {
  scenario: typeof parsed.values.scenario === "string" ? parsed.values.scenario : undefined,
  walkthrough: parsed.values.walkthrough === true,
  decision: typeof parsed.values.decision === "string" ? parsed.values.decision : undefined,
  policy: typeof parsed.values.policy === "string" ? parsed.values.policy : undefined,
  fixture: typeof parsed.values.fixture === "string" ? parsed.values.fixture : undefined,
  reset: parsed.values.reset === true,
  help: parsed.values.help === true,
};

if (args.help) {
  printHelp();
  process.exit(0);
}

await main();

async function main(): Promise<void> {
  if (args.reset) {
    handleReset();
    return;
  }

  // Live Composite Run Mode
  if (args.decision && args.policy && args.fixture) {
    await handleLiveRun(args.fixture, args.decision, args.policy);
    return;
  }

  // Specific scenario
  if (args.scenario) {
    const validScenarios: DemoScenarioId[] = ["revision", "approved", "escalated"];
    const targetId = args.scenario.toLowerCase() as DemoScenarioId;
    if (!validScenarios.includes(targetId)) {
      console.error(`Invalid scenario "${args.scenario}". Choose from: ${validScenarios.join(", ")}`);
      process.exit(1);
    }
    const scenario = await loadScenario(targetId);
    console.log(renderScenario(scenario));
    return;
  }

  // Full Walkthrough Mode
  if (args.walkthrough) {
    await runWalkthrough();
    return;
  }

  // Interactive Menu (default)
  await runInteractiveMenu();
}

async function handleLiveRun(fixturePath: string, decisionPath: string, policyPath: string): Promise<void> {
  try {
    const fixture = JSON.parse(await readFile(resolve(fixturePath), "utf8")) as ReviewFixture;
    const decision = JSON.parse(await readFile(resolve(decisionPath), "utf8")) as GuardianDecision;
    const policy = JSON.parse(await readFile(resolve(policyPath), "utf8")) as {
      policyResult?: PolicyResult;
      escrowAction?: EscrowActionRecord;
    } & PolicyResult;

    const policyResult: PolicyResult = policy.policyResult ?? policy;
    const escrowAction: EscrowActionRecord = policy.escrowAction ?? {
      action: policyResult.escrow_action,
      chain: "base_sepolia",
      contract_address: "0x1111111111111111111111111111111111111111",
      milestone_id: fixture.milestone_id,
      amount: "100000000000000000",
      actor: "guardian-cli",
      tx_hash: policyResult.transaction_hash,
      receipt_status: policyResult.receipt_status,
      policy_result: policyResult,
      created_at: new Date().toISOString(),
    };

    console.log(renderCompositeRun(fixture, decision, policyResult, escrowAction));
  } catch (error) {
    console.error(`Error reading live pipeline files: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function runWalkthrough(): Promise<void> {
  const scenarios = await loadAllScenarios();

  console.log("\n" + divider("MILESTONE-ESCROW GUARDIAN • FULL STORY WALKTHROUGH") + "\n");

  for (let idx = 0; idx < scenarios.length; idx++) {
    const scenario = scenarios[idx];
    console.log(renderScenario(scenario));

    if (idx < scenarios.length - 1) {
      console.log("\n" + divider() + "\n");
      await prompt(`${bold("Press Enter to continue to next phase...")}`);
      console.log("\n");
    }
  }

  console.log("\n" + divider("WALKTHROUGH COMPLETE") + "\n");
}

async function runInteractiveMenu(): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  console.log("\n" + divider("MILESTONE-ESCROW GUARDIAN • DEMO SURFACE") + "\n");
  console.log(`  ${bold("1.")} Scenario 1: ${colored("Fresh-Session Recall (Revision Required)", "yellow")}`);
  console.log(`  ${bold("2.")} Scenario 2: ${colored("Milestone Satisfied (Base Sepolia Release)", "green")}`);
  console.log(`  ${bold("3.")} Scenario 3: ${colored("Safety & Deletion Gate (Escalation)", "red")}`);
  console.log(`  ${bold("4.")} Run Full Sequential Walkthrough (Video Storyboard)`);
  console.log(`  ${bold("5.")} Reset Demo State`);
  console.log(`  ${bold("q.")} Exit\n`);

  const answer = await rl.question(`  ${bold("Select an option [1-5, q]:")} `);
  rl.close();

  const choice = answer.trim().toLowerCase();

  switch (choice) {
    case "1": {
      const scenario = await loadScenario("revision");
      console.log("\n" + renderScenario(scenario) + "\n");
      break;
    }
    case "2": {
      const scenario = await loadScenario("approved");
      console.log("\n" + renderScenario(scenario) + "\n");
      break;
    }
    case "3": {
      const scenario = await loadScenario("escalated");
      console.log("\n" + renderScenario(scenario) + "\n");
      break;
    }
    case "4":
      await runWalkthrough();
      break;
    case "5":
      handleReset();
      break;
    case "q":
      console.log("Exiting.");
      break;
    default:
      console.log(`Unknown choice "${choice}". Defaulting to full walkthrough:\n`);
      await runWalkthrough();
      break;
  }
}

function handleReset(): void {
  console.log("\n" + divider("DEMO STATE"));
  console.log(`  ${colored("✔", "green")} Demo uses stateless fixtures — no persistent caches to clear.`);
  console.log(`  ${colored("✔", "green")} All scenarios load fresh from shared/fixtures on every run.`);
  console.log(`  ${colored("✔", "green")} Ready for rerun.`);
  console.log(divider() + "\n");
}

function prompt(text: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return rl.question(text).finally(() => rl.close());
}

function printHelp(): void {
  console.log(
    [
      "milestone-guardian-demo - User-facing presentation surface for Milestone-Escrow Guardian.",
      "",
      "Usage:",
      "  tsx src/cli.ts [options]",
      "",
      "Options:",
      "  -s, --scenario <id>    Render a specific scenario: 'revision' | 'approved' | 'escalated'.",
      "  -w, --walkthrough      Run the full 3-part storyboard with interactive pauses.",
      "  -f, --fixture <path>   Path to review-request JSON (live composite mode).",
      "  -d, --decision <path>  Path to Guardian decision JSON (live composite mode).",
      "  -p, --policy <path>    Path to Policy Result / Action JSON (live composite mode).",
      "  -r, --reset            Reset demo state and verify ready status.",
      "  -h, --help             Display this help message.",
      "",
      "Examples:",
      "  tsx src/cli.ts --scenario revision",
      "  tsx src/cli.ts --scenario approved",
      "  tsx src/cli.ts --walkthrough",
    ].join("\n"),
  );
}
