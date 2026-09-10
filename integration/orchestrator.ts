import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CURRENT_DIR, "..");
const ARTIFACTS_DIR = resolve(CURRENT_DIR, "artifacts");

const C1_DIR = resolve(REPO_ROOT, "contributors", "contributor-1-guardian");
const C2_DIR = resolve(REPO_ROOT, "contributors", "contributor-2-escrow");
const C3_DIR = resolve(REPO_ROOT, "contributors", "contributor-3-demo");

interface PipelineResult {
  fixturePath: string;
  decisionPath: string;
  policyPath: string;
}

export async function runPipeline(
  scenario: "revision" | "approved" = "approved",
  options: { dryRun?: boolean; local?: boolean } = { dryRun: true, local: true },
): Promise<PipelineResult> {
  await mkdir(ARTIFACTS_DIR, { recursive: true });

  const fixtureName =
    scenario === "approved" ? "review-request-approved.json" : "review-request-missing-idempotency.json";
  const fixturePath = resolve(REPO_ROOT, "shared", "fixtures", fixtureName);
  const decisionPath = resolve(ARTIFACTS_DIR, `decision-${scenario}.json`);
  const policyPath = resolve(ARTIFACTS_DIR, `policy-result-${scenario}.json`);
  const dbPath = resolve(ARTIFACTS_DIR, `sibyl-${scenario}.db`);

  console.log(`\n>>> STEP 1: Running Contributor 1 (Sibyl Guardian Memory)...`);
  const pythonBin = process.platform === "win32"
    ? resolve(REPO_ROOT, ".venv", "Scripts", "python.exe")
    : resolve(REPO_ROOT, ".venv", "bin", "python");

  const c1Args = [
    "-m",
    "guardian_memory.cli",
    fixturePath,
    "--seed",
    "--database",
    dbPath,
  ];

  const c1Run = await execFileAsync(pythonBin, c1Args, { cwd: C1_DIR });
  const decisionJson = c1Run.stdout.trim();
  await writeFile(decisionPath, `${decisionJson}\n`, "utf8");
  console.log(`    [PASS] Decision emitted -> ${decisionPath}`);

  console.log(`\n>>> STEP 2: Running Contributor 2 (Deterministic Escrow Policy Gate)...`);
  const escrowFixturePath = resolve(C2_DIR, "fixtures", "escrow-state.example.json");
  const c2CliPath = resolve(C2_DIR, "src", "cli.ts");

  const c2Args = [
    "tsx",
    c2CliPath,
    "--decision",
    decisionPath,
    "--escrow",
    escrowFixturePath,
    "--yes",
    "--out",
    policyPath,
  ];

  if (options.local) c2Args.push("--local");
  if (options.dryRun) c2Args.push("--dry-run");

  const isWin = process.platform === "win32";
  const pnpmCmd = isWin ? "pnpm.cmd" : "pnpm";
  await execFileAsync(pnpmCmd, ["exec", "tsx", ...c2Args.slice(1)], { cwd: C2_DIR, shell: isWin });
  console.log(`    [PASS] Policy evaluated & action logged -> ${policyPath}`);

  console.log(`\n>>> STEP 3: Running Contributor 3 (Presentation & Demo Surface)...`);
  const c3CliPath = resolve(C3_DIR, "src", "cli.ts");
  const c3Args = [
    "tsx",
    c3CliPath,
    "--fixture",
    fixturePath,
    "--decision",
    decisionPath,
    "--policy",
    policyPath,
  ];

  const c3Run = await execFileAsync(pnpmCmd, ["exec", "tsx", ...c3Args.slice(1)], { cwd: C3_DIR, shell: isWin });
  console.log(c3Run.stdout);

  return { fixturePath, decisionPath, policyPath };
}

// Direct execution
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const scenario = process.argv.includes("--revision") ? "revision" : "approved";
  runPipeline(scenario).catch((err) => {
    console.error(`Pipeline failed:`, err);
    process.exit(1);
  });
}
