const test = require("node:test");
const assert = require("node:assert/strict");
const MonthlyCore = require("../src/monthly-core.js");

test("builds a five-week calendar when the month fits", () => {
  const cells = MonthlyCore.buildMonthCalendar("2026-02");
  assert.equal(cells.length, 35);
  assert.deepEqual(cells[0], {
    date: "2026-02-01",
    day: 1,
    weekday: 0,
    inMonth: true,
  });
  assert.equal(cells.at(-1).date, "2026-03-07");
});

test("builds a six-week calendar with adjacent month days", () => {
  const cells = MonthlyCore.buildMonthCalendar("2026-08");
  assert.equal(cells.length, 42);
  assert.equal(cells[0].date, "2026-07-26");
  assert.equal(cells.at(-1).date, "2026-09-05");
  assert.equal(cells[0].inMonth, false);
});

test("groups record pairs by date and skips malformed dates", () => {
  const first = { item: { date: "2026-07-03", price: 100 }, index: 2 };
  const second = { item: { date: "2026-07-03", price: 200 }, index: 3 };
  const grouped = MonthlyCore.groupRecordsByDate([
    first,
    second,
    { item: { date: "invalid" }, index: 4 },
  ]);
  assert.deepEqual(grouped, { "2026-07-03": [first, second] });
});

test("selects today, first record, or first day as the calendar default", () => {
  assert.equal(
    MonthlyCore.defaultSelectedDate("2026-07", {}, "2026-07-26"),
    "2026-07-26",
  );
  assert.equal(
    MonthlyCore.defaultSelectedDate(
      "2026-06",
      { "2026-06-20": [{}], "2026-06-04": [{}] },
      "2026-07-26",
    ),
    "2026-06-04",
  );
  assert.equal(
    MonthlyCore.defaultSelectedDate("2026-05", {}, "2026-07-26"),
    "2026-05-01",
  );
});

test("clips a monthly billing day to the end of short months", () => {
  assert.equal(
    MonthlyCore.scheduleOccurrenceDate({ billingDay: 31 }, "2026-02"),
    "2026-02-28",
  );
  assert.equal(
    MonthlyCore.scheduleOccurrenceDate({ billingDay: 31 }, "2028-02"),
    "2028-02-29",
  );
});

test("builds scheduled, overdue, and paid occurrences", () => {
  const schedules = [
    { id: "a", name: "Music", billingDay: 5, startMonth: "2026-01", enabled: true },
    { id: "b", name: "Video", billingDay: 20, startMonth: "2026-01", enabled: true },
    { id: "c", name: "Disabled", billingDay: 2, enabled: false },
  ];
  const records = [
    { scheduleId: "a", scheduleOccurrenceDate: "2026-07-05", date: "2026-07-05" },
  ];
  const occurrences = MonthlyCore.buildScheduleOccurrences(
    schedules,
    "2026-07",
    records,
    "2026-07-10",
  );
  assert.deepEqual(
    occurrences.map(({ date, status, recordIndex }) => ({ date, status, recordIndex })),
    [
      { date: "2026-07-05", status: "paid", recordIndex: 0 },
      { date: "2026-07-20", status: "scheduled", recordIndex: -1 },
    ],
  );

  const overdue = MonthlyCore.buildScheduleOccurrences(
    [{ id: "x", name: "Rent", billingDay: 1, enabled: true }],
    "2026-07",
    [],
    "2026-07-10",
  );
  assert.equal(overdue[0].status, "overdue");
});

test("respects schedule start and end months", () => {
  const occurrences = MonthlyCore.buildScheduleOccurrences(
    [
      { id: "old", billingDay: 1, startMonth: "2025-01", endMonth: "2026-06" },
      { id: "future", billingDay: 2, startMonth: "2026-08" },
      { id: "active", billingDay: 3, startMonth: "2026-07", endMonth: "2026-07" },
    ],
    "2026-07",
    [],
    "2026-07-01",
  );
  assert.deepEqual(occurrences.map((item) => item.schedule.id), ["active"]);
});

test("filters records and occurrences by account, category, and project", () => {
  const filters = { account: "Card", category: "固定支出", project: "p1" };
  const pairs = [
    { item: { account: "Card", mainCat: "固定支出", projectId: "p1" } },
    { item: { account: "Cash", mainCat: "固定支出", projectId: "p1" } },
  ];
  assert.equal(MonthlyCore.filterRecordPairs(pairs, filters).length, 1);
  assert.equal(
    MonthlyCore.filterOccurrences(
      [
        { schedule: { account: "Card", mainCat: "固定支出", projectId: "p1" } },
        { schedule: { account: "Card", mainCat: "娛樂", projectId: "p1" } },
      ],
      filters,
    ).length,
    1,
  );
});

test("returns overdue and soon-due schedule reminders", () => {
  const reminders = MonthlyCore.getScheduleReminders(
    [
      { date: "2026-07-20", status: "overdue" },
      { date: "2026-07-28", status: "scheduled" },
      { date: "2026-07-30", status: "scheduled" },
      { date: "2026-07-26", status: "paid" },
    ],
    "2026-07-26",
    3,
  );
  assert.deepEqual(reminders.map((item) => item.date), [
    "2026-07-20",
    "2026-07-28",
  ]);
});

test("detects stable monthly expenses and excludes existing schedules", () => {
  const records = [
    { type: "支出", date: "2026-04-10", price: 980, name: "Music", account: "Card", currency: "¥", mainCat: "固定支出" },
    { type: "支出", date: "2026-05-11", price: 980, name: "Music", account: "Card", currency: "¥", mainCat: "固定支出" },
    { type: "支出", date: "2026-06-10", price: 1000, name: "Music", account: "Card", currency: "¥", mainCat: "固定支出" },
    { type: "支出", date: "2026-04-02", price: 500, name: "Variable", account: "Cash", currency: "¥" },
    { type: "支出", date: "2026-05-20", price: 900, name: "Variable", account: "Cash", currency: "¥" },
    { type: "支出", date: "2026-06-28", price: 200, name: "Variable", account: "Cash", currency: "¥" },
  ];
  const candidates = MonthlyCore.detectRecurringCandidates(records, []);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].name, "Music");
  assert.equal(candidates[0].billingDay, 10);
  assert.equal(candidates[0].amount, 980);
  assert.equal(
    MonthlyCore.detectRecurringCandidates(records, [
      { name: "Music", account: "Card", currency: "¥" },
    ]).length,
    0,
  );
});
