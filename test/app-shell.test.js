const test = require("node:test");
const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");

test("app shell resources exist", () => {
  const worker = readFileSync(resolve(root, "sw.js"), "utf8");
  const shellBlock = worker.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(shellBlock, "APP_SHELL declaration is missing");
  const resources = [...shellBlock[1].matchAll(/'\.\/([^']*)'/g)].map((match) => match[1]);
  for (const resource of resources) {
    if (!resource) continue;
    assert.ok(existsSync(resolve(root, resource)), `missing app shell resource: ${resource}`);
  }
});

test("application libraries do not depend on a CDN", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.doesNotMatch(html, /cdn\.(?:jsdelivr|tailwindcss)\.com/);
  assert.doesNotMatch(html, /fonts\.googleapis\.com/);
  assert.match(html, /assets\/vendor\/chart\.umd\.js/);
  assert.match(html, /assets\/vendor\/supabase\.js/);
});

test("recurring schedules are included in local and cloud persistence", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /myRecurringSchedulesV1/);
  assert.match(html, /function collectBudgetPayload\(\)[\s\S]*?recurringSchedules/);
  assert.match(html, /function applyBudgetPayload\(payload = \{\}\)[\s\S]*?payload\.recurringSchedules/);
  assert.match(html, /scheduleOccurrenceDate/);
});
