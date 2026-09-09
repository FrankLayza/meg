import { parseArgs } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { BaseEscrowClient } from "./base-escrow.js";
import { MockEscrowClient } from "./escrow.js";
import { InvalidDecisionError, runRelease, type ReleaseOutput } from "./release.js";
import type { GuardianDecision, PolicyConfig } from "./types.js";

interface CliArgs {
  decision: string;
  escrow: string;
  maxAmount: string | undefined;
  contract: string | undefined;
  allowlist: string[];
  local: boolean;
  dryRun: boolean;
  yes: boolean;
  actor: string;
  out: string | undefined;
  help: boolean;
}

const FIRST_ETHER = 1_000_000_000_000_000_000n;

const options = parseArgs({
  options: {
    decision: { type: "string", short: "d" },
    escrow: { type: "string", short: "m" },
    "max-amount": { type: "string" },
    contract: { type: "string" },
    allowlist: { type: "string", multiple: true },
    local: { type: "boolean" },
    "dry-run": { type: "boolean" },
    yes: { type: "boolean" },
    actor: { type: "string" },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
  allowPositionals: true,
});

const args: CliArgs = {
  decision: readString(options.values.decision),
  escrow: readString(options.values.escrow),
  maxAmount: options.values["max-amount"] ?? undefined,
  contract: options.values.contract ?? undefined,
  allowlist: (options.values.allowlist ?? []).flatMap((value) => value.split(",")).filter(Boolean),
  local: options.values.local === true,
  dryRun: options.values["dry-run"] === true,
  yes: options.values.yes === true,
  actor: options.values.actor ?? "cli-user",
  out: options.values.out ?? undefined,
  help: options.values.help === true,
};

if (args.help || !args.decision || !args.escrow) {
  printUsage();
  process.exit(args.help ? 0 : 2);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

async function main(): Promise<void> {
  const decision = await readJson<GuardianDecision>(resolve(args.decision));
  const escrowFixture = await readJson<{
    milestoneId: string;
    contract_address: string;
    amount: string;
    evidencePresent: boolean;
  }>(resolve(args.escrow));

  const contractAddress = args.contract ?? process.env.ESCROW_CONTRACT_ADDRESS ?? escrowFixture.contract_address;
  const allowlist = args.allowlist.length > 0 ? args.allowlist : splitEnvList(process.env.ESCROW_ALLOWLIST);
  const maxAmount = parseAmount(args.maxAmount ?? process.env.ESCROW_MAX_AMOUNT_WEI ?? FIRST_ETHER.toString());

  const escrow = {
    milestoneId: escrowFixture.milestoneId,
    contract_address: contractAddress,
    amount: parseAmount(escrowFixture.amount),
    evidencePresent: escrowFixture.evidencePresent,
    funded: false,
    released: false,
    disputeOpen: false,
  };

  const config: PolicyConfig = {
    maxAmount,
    requireConfirmation: true,
    allowlistedContracts: allowlist,
  };

  const confirmed = await resolveConfirmation(config, escrow.milestoneId, escrow.amount);
  const client = args.local ? new MockEscrowClient() : buildBaseClient(contractAddress);

  const output = await runRelease({
    decision,
    escrow,
    config,
    confirmed,
    dryRun: args.dryRun,
    actor: args.actor,
    client,
  });

  await emit(output);
}

function buildBaseClient(contractAddress: string): BaseEscrowClient {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";
  const privateKey = process.env.GUARDIAN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("GUARDIAN_PRIVATE_KEY is required unless --local is used.");
  }
  return new BaseEscrowClient({ rpcUrl, privateKey, contractAddress });
}

async function resolveConfirmation(config: PolicyConfig, milestoneId: string, amount: bigint): Promise<boolean> {
  if (config.requireConfirmation && !args.yes && !args.dryRun) {
    const answer = await prompt(`Confirm escrow release for ${milestoneId} (${amount} wei)? [y/N] `);
    return answer.trim().toLowerCase() === "y";
  }
  return true;
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return rl.question(question).finally(() => rl.close());
}

async function emit(output: ReleaseOutput): Promise<void> {
  const payload = JSON.stringify({ ...output, dry_run: args.dryRun || args.local }, null, 2);
  if (args.out) {
    await writeFile(resolve(args.out), `${payload}\n`, "utf8");
    console.log(`Wrote output to ${args.out}`);
  } else {
    console.log(payload);
  }
}

function readString(value: string | boolean | undefined): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function splitEnvList(value: string | undefined): string[] {
  if (value && value.trim().length > 0) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseAmount(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Amount must be a non-negative integer in wei, got "${value}".`);
  }
  return BigInt(value);
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

function printUsage(): void {
  console.log(
    [
      "escrow-release - run the deterministic escrow policy and optional Base Sepolia release.",
      "",
      "Usage: tsx src/cli.ts --decision <decision.json> --escrow <escrow-state.json> [options]",
      "",
      "Options:",
      "  -d, --decision <path>   Guardian decision JSON (shared/contracts/decision.schema.json).",
      "  -m, --escrow <path>     Local escrow fixture: { milestoneId, contract_address, amount, evidencePresent }.",
      "      --local             Use the mock escrow client (standalone, no chain).",
      "      --dry-run           Run policy + simulation only; never send a transaction.",
      "      --yes               Skip the interactive confirmation prompt.",
      "      --max-amount <wei>  Deterministic release cap (default: 1 ether or ESCROW_MAX_AMOUNT_WEI).",
      "      --contract <addr>   Escrow contract address (default: ESCROW_CONTRACT_ADDRESS | fixture).",
      "      --allowlist <csv>   Allowed contract addresses (comma separated; default: ESCROW_ALLOWLIST; absent means deny).",
      "      --actor <name>      Audit actor label recorded in the EscrowActionRecord.",
      "      --out <path>        Write the policy result + action record JSON to a file.",
      "  -h, --help              Show this help.",
      "",
      "Env (Base mode): BASE_SEPOLIA_RPC_URL (default https://sepolia.base.org), GUARDIAN_PRIVATE_KEY, ESCROW_CONTRACT_ADDRESS.",
    ].join("\n"),
  );
}
