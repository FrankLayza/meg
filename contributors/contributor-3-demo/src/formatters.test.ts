import test from "node:test";
import assert from "node:assert/strict";

import {
  badge,
  checkmark,
  divider,
  formatTable,
  outcomeBadge,
  panel,
  stripAnsi,
  tag,
} from "./formatters.js";

test("#given text with ansi sequences, #when stripAnsi is called, #then clean text is returned", () => {
  const colored = "\x1b[31mError\x1b[0m";
  assert.equal(stripAnsi(colored), "Error");
});

test("#given an outcome string, #when outcomeBadge is formatted, #then expected label is returned", () => {
  assert.match(stripAnsi(outcomeBadge("approve")), /APPROVED/);
  assert.match(stripAnsi(outcomeBadge("request_revision")), /REVISION REQUIRED/);
  assert.match(stripAnsi(outcomeBadge("escalate")), /HUMAN ESCALATION/);
});

test("#given a pass/fail boolean, #when checkmark is called, #then correct status is returned", () => {
  assert.equal(stripAnsi(checkmark(true)), "[PASS]");
  assert.equal(stripAnsi(checkmark(false)), "[FAIL]");
});

test("#given table rows, #when formatTable is called, #then output aligns properly", () => {
  const rows: Array<[string, string]> = [
    ["Check 1", "Passed"],
    ["Long Check Name", "Failed"],
  ];
  const tableStr = formatTable(rows, 20);
  assert.match(tableStr, /Check 1/);
  assert.match(tableStr, /Long Check Name/);
});

test("#given panel title and lines, #when panel is formatted, #then borders encase the content", () => {
  const p = panel("TEST TITLE", ["Line 1 content", "Line 2 content"], "cyan");
  const stripped = stripAnsi(p);
  assert.match(stripped, /TEST TITLE/);
  assert.match(stripped, /Line 1 content/);
  assert.match(stripped, /Line 2 content/);
  assert.match(stripped, /┌─/);
  assert.match(stripped, /└─/);
});

test("#given an identifier, #when tag is formatted, #then it includes brackets", () => {
  assert.equal(stripAnsi(tag("feedback-001")), "[feedback-001]");
});
