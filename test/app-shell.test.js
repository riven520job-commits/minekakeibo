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

test("monthly calendar opens daily income and expense details", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const calendar =
    html.match(
      /function renderMonthlyCalendar\(context\) \{[\s\S]*?\n      \}/,
    )?.[0] || "";
  assert.match(calendar, /monthlyCalendarDaySummary\(daySummary\)/);
  assert.match(calendar, /setMonthlyCalendarDate\('\$\{cell\.date\}'\)/);
  assert.match(calendar, /is-selected/);
  assert.match(calendar, /renderMonthlyCalendarDayDetail/);
  assert.match(html, /monthly-calendar-selected-detail/);
  assert.match(html, /scrollIntoView/);
  assert.doesNotMatch(calendar, /renderScheduleSuggestionPanel/);
  assert.match(html, /function renderMonthlyCalendarDayDetail/);
  assert.match(html, /monthlyCalendarExpenseItems/);
  assert.match(html, /monthlyCalendarIncomeItems/);
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
  assert.match(worker, /src\/ui-security\.js/);
  assert.match(worker, /src\/search-core\.js/);
});

test("local persistence is centralized without patching browser storage", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /function persistLocal\(key, value, options = \{\}\)/);
  assert.doesNotMatch(html, /Storage\.prototype\.setItem\s*=/);
  assert.doesNotMatch(html, /localStorage\.setItem\(/);
});

test("cloud sync stops when local and remote data both changed", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /const hasRemoteChanges =/);
  assert.match(
    html,
    /if \(hasRemoteChanges && hasUnsyncedLocalChanges\)[\s\S]*?return;/,
  );
});

test("cloud and backup imports validate before transactional application", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const applyPayload =
    html.match(/function applyBudgetPayload\(payload = \{\}\) \{[\s\S]*?\n      \}/)?.[0] || "";
  assert.match(applyPayload, /StorageCore\.validateBudgetPayload/);
  assert.match(applyPayload, /const previous = new Map/);
  assert.match(applyPayload, /finally/);
  assert.match(html, /file\.size > 10_000_000/);
});

test("dynamic inline values and custom images use the security helpers", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /src\/ui-security\.js/);
  assert.match(html, /function encodeInlineValue/);
  assert.match(html, /UISecurity\.isSafeDataImage\(icon\)/);
  assert.doesNotMatch(
    html,
    /onclick="[^"]*'\$\{(?:project|preferred)\.id\}'/,
  );
  assert.doesNotMatch(html, /escapeHTML\(schedule\.id\)/);
  assert.match(html, /capture="environment"/);
  assert.match(html, /function applyCustomCategoryEmoji/);
  assert.match(html, /UISecurity\.isSafeDataImage\(imageData\)/);
  assert.match(html, /png\|jpeg\|webp\|gif/);
  assert.doesNotMatch(
    html,
    /onclick="triggerMainCategoryUpload\(\)">\s*(?:相簿圖片|檔案圖片|拍照)/,
  );
});

test("monthly detail exposes searchable records", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /src\/search-core\.js/);
  assert.match(html, /id="monthly-detail-search"/);
  assert.match(html, /SearchCore\.filterRecords/);
  assert.match(html, /item\.merchant/);
  assert.match(html, /item\.note/);
  assert.match(html, /project\?\.name/);
});

test("mobile monthly calendar stacks and preserves daily amounts", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(
    html,
    /\.monthly-calendar-day-total \{[\s\S]*?display: grid;[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/,
  );
  assert.match(html, /font-variant-numeric: tabular-nums/);
  assert.match(html, /function monthlyCalendarAmountLabel/);
  assert.match(html, /monthly-calendar-day-total is-expense" aria-label=/);
  assert.match(html, /monthly-calendar-day-total is-income" aria-label=/);
  assert.match(html, /#monthly-report-content\.calendar-focus/);
  assert.match(html, /monthly-calendar-tools/);
  const daySummary =
    html.match(/function monthlyCalendarDaySummary\(summary\) \{[\s\S]*?\n      \}/)?.[0] || "";
  assert.match(daySummary, /aria-hidden="true">−</);
  assert.match(daySummary, /aria-hidden="true">＋</);
  assert.doesNotMatch(daySummary, /monthly-calendar-schedule-count/);
});

test("ergonomic UI keeps labels, touch targets, danger cues, and desktop columns", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /nav \.nav-btn span\[data-i18n\] \{[\s\S]*?display: block/);
  assert.match(html, /button:not\(\.monthly-calendar-day\)[\s\S]*?min-height: 44px/);
  assert.match(html, /button\[class\*="text-red-"\][\s\S]*?color: #b4232f !important/);
  assert.match(html, /scroll-snap-type: x proximity/);
  assert.match(html, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(
    html,
    /function handleCenterAction\(\) \{\s*openAddWithSelectedDate\(\);/,
    "the center add button should open the form from every page",
  );
  assert.match(html, /data-i18n="paymentMethod">付款帳戶/);
  assert.match(html, /id="record-time"\s+aria-label="交易時間"/);
  assert.doesNotMatch(html, /<div class="add-tags">/);
  assert.doesNotMatch(html, /calculatorPointerQuick\(event, (?:538|1299|587|2026|799|868)\)/);
});

test("modal accessibility translates actions and traps keyboard focus", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /data-i18n-aria="a11yClose"/);
  assert.match(html, /querySelectorAll\("\[data-i18n-aria\]"\)/);
  assert.match(html, /event\.key !== "Tab" \|\| !activeModal/);
  assert.match(html, /document\.activeElement === last/);
  assert.match(html, /data-monthly-tab=/);
  assert.match(html, /inline: "center"/);
});

test("credit card payments link a debit account without duplicating expenses", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /function openCreditPaymentModal/);
  assert.match(html, /function saveCreditPayment/);
  assert.match(html, /creditPayment: true/);
  assert.match(html, /type: "轉帳"/);
  assert.match(html, /setting\.primaryAccount = debitAccount/);
  assert.match(html, /pendingBillAppliedAmount/);
  assert.match(
    html,
    /setting\.pendingBillAmount = Math\.max\([\s\S]*?pendingBillAmount[\s\S]*?- pendingBillAppliedAmount/,
  );
  assert.doesNotMatch(
    html.match(/function saveCreditPayment[\s\S]*?\n      \}/)?.[0] || "",
    /type: "支出"/,
  );
});

test("deleting linked accounts and projects preserves relational data", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const deleteAccount =
    html.match(/function deleteSubAccount\(acc\) \{[\s\S]*?\n      \}/)?.[0] || "";
  assert.match(deleteAccount, /recurringSchedules\.some/);
  assert.match(deleteAccount, /setting\?\.primaryAccount === acc/);
  assert.match(deleteAccount, /sharedLimitAccounts/);
  const deleteProject =
    html.match(/function deleteBudgetProject\(projectId\) \{[\s\S]*?\n      \}/)?.[0] || "";
  assert.match(deleteProject, /recurringSchedules\.forEach/);
  assert.match(deleteProject, /persistRecurringSchedules\(\)/);
  assert.doesNotMatch(deleteProject, /renderDailyLedger|renderMonthReport/);
});

test("project dates reject invalid and reversed ranges", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /function isValidProjectDate/);
  assert.match(html, /formatLocalDate\(parsed\) === value/);
  const addProject =
    html.match(/function addBudgetProject\(\) \{[\s\S]*?\n      \}/)?.[0] || "";
  assert.match(addProject, /!isValidProjectDate\(start\)/);
  assert.match(addProject, /end < start/);
});

test("credit card due dates support fixed, offset, and manual modes", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.match(html, /paymentDueMode: "fixed_day"/);
  assert.match(html, /value="after_statement"/);
  assert.match(html, /value="manual"/);
  assert.match(html, /function accountPaymentDueDate/);
  assert.match(html, /paymentDueOffsetDays/);
  assert.match(html, /manualDueStatementMonth === statementMonth/);
});
