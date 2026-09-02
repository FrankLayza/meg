import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface ReviewFixture {
  project_id: string;
  milestone_id: string;
  acceptance_criteria: string[];
  evidence: Array<{ id: string; summary: string }>;
}

const fixturePath = resolve(process.cwd(), "..", "..", "shared", "fixtures", "review-request-missing-idempotency.json");
const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as ReviewFixture;

console.log(`Project: ${fixture.project_id}`);
console.log(`Milestone: ${fixture.milestone_id}`);
console.log("Acceptance criteria:");
for (const criterion of fixture.acceptance_criteria) console.log(`- ${criterion}`);
console.log("Evidence:");
for (const item of fixture.evidence) console.log(`- ${item.id}: ${item.summary}`);
console.log("\nThis surface is ready to consume Contributor 1 decision JSON and Contributor 2 policy JSON.");
