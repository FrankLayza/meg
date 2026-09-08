import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import type { ValidateFunction } from "ajv";
import type { GuardianDecision, PolicyResult } from "./types.js";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const DECISION_SCHEMA_PATH = resolve(REPO_ROOT, "shared", "contracts", "decision.schema.json");
const POLICY_RESULT_SCHEMA_PATH = resolve(REPO_ROOT, "shared", "contracts", "policy-result.schema.json");

const ajv = new Ajv2020({ allErrors: true });

interface LoadedValidators {
  decision: ValidateFunction;
  policyResult: ValidateFunction;
}

let validatorsPromise: Promise<LoadedValidators> | null = null;

function getValidators(): Promise<LoadedValidators> {
  if (!validatorsPromise) {
    validatorsPromise = (async () => {
      const [decisionSchema, policyResultSchema] = await Promise.all([
        readJson(DECISION_SCHEMA_PATH),
        readJson(POLICY_RESULT_SCHEMA_PATH),
      ]);
      return {
        decision: ajv.compile(decisionSchema),
        policyResult: ajv.compile(policyResultSchema),
      };
    })();
  }
  return validatorsPromise;
}

async function readJson(path: string): Promise<object> {
  return JSON.parse(await readFile(path, "utf8")) as object;
}

function summarizeErrors(validate: ValidateFunction): string[] {
  return (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`.trim());
}

export async function validateDecision(value: unknown): Promise<ValidationResult> {
  const validators = await getValidators();
  const ok = validators.decision(value);
  return ok ? { ok: true, errors: [] } : { ok: false, errors: summarizeErrors(validators.decision) };
}

export async function validatePolicyResult(value: unknown): Promise<ValidationResult> {
  const validators = await getValidators();
  const ok = validators.policyResult(value);
  return ok ? { ok: true, errors: [] } : { ok: false, errors: summarizeErrors(validators.policyResult) };
}

export function isGuardianDecision(value: unknown): value is GuardianDecision {
  return isObject(value) && typeof value.outcome === "string" && typeof value.rationale === "string";
}

export function isPolicyResult(value: unknown): value is PolicyResult {
  return isObject(value) && typeof value.allowed === "boolean" && typeof value.reason === "string";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}