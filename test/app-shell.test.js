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

test("monthly report only exposes implemented tabs", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const tabs = html.match(/function monthlyReportTabs\(\) \{[\s\S]*?\n      \}/)?.[0] || "";
  for (const id of ["calendar", "overview", "detail", "category", "ranking"])
    assert.match(tabs, new RegExp(`id: "${id}"`));
  for (const id of ["accountGroup", "merchant", "target"])
    assert.doesNotMatch(tabs, new RegExp(`id: "${id}"`));
});

test("monthly calendar stays summary-only without daily detail or bottom suggestions", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const calendar =
    html.match(
      /function renderMonthlyCalendar\(context\) \{[\s\S]*?\n      \}/,
    )?.[0] || "";
  assert.match(calendar, /monthlyCalendarDaySummary\(daySummary\)/);
  assert.doesNotMatch(calendar, /monthly-calendar-detail/);
  assert.doesNotMatch(calendar, /renderScheduleSuggestionPanel/);
  assert.doesNotMatch(calendar, /setMonthlyCalendarDate/);
});

test("app provides complete backup and accessible modal support", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /function exportFullBackup/);
  assert.match(html, /function importFullBackup/);
  assert.match(html, /function initModalAccessibility/);
  assert.match(html, /role", "dialog"/);
  assert.doesNotMatch(html, /user-scalable=no/);
  assert.match(
    html,
    /querySelectorAll\('div\[id\$="-modal"\]'\)/,
    "modal discovery must not include the installment-count-modal input",
  );
});

test("service worker separates core and optional app shell resources", () => {
  const worker = readFileSync(resolve(root, "sw.js"), "utf8");
  assert.match(worker, /const CORE_SHELL = \[/);
  assert.match(worker, /Promise\.allSettled/);
  assert.match(worker, /src\/storage-core\.js/);
});
