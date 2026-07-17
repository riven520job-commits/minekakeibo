const test = require("node:test");
const assert = require("node:assert/strict");
const StatsCore = require("../src/stats-core.js");

test("builds current and previous six-month ranges", () => {
  const result = StatsCore.getStatsRangeConfig([], "6m", new Date(2026, 6, 18));
  assert.deepEqual(result.months, [
    "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07",
  ]);
  assert.deepEqual(result.previousMonths, [
    "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01",
  ]);
});

test("all range starts at the earliest valid expense", () => {
  const expenses = [{ date: "invalid" }, { date: "2024-11-20" }, { date: "2025-03-01" }];
  const result = StatsCore.getStatsRangeConfig(expenses, "all", new Date(2026, 6, 18));
  assert.equal(result.months[0], "2024-11");
  assert.equal(result.months.at(-1), "2026-07");
});

test("normalizes legacy expense defaults", () => {
  assert.deepEqual(
    StatsCore.normalizeExpense({ type: "支出", date: "2026-07-18", price: "120" }),
    {
      item: { type: "支出", date: "2026-07-18", price: "120" },
      month: "2026-07",
      amount: 120,
      currency: "¥",
      category: "未分類",
    },
  );
});

test("rejects malformed records without throwing", () => {
  assert.equal(StatsCore.normalizeExpense(null), null);
  assert.equal(StatsCore.normalizeExpense({ type: "支出", date: "2026-99-01", price: 1 }), null);
  assert.equal(StatsCore.normalizeExpense({ type: "支出", date: "2026-07-01", price: "abc" }), null);
});
