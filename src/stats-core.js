(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StatsCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function addMonths(date, months) {
    return new Date(date.getFullYear(), date.getMonth() + months, 1);
  }

  function monthsBetween(startDate, endDate) {
    const months = [];
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    while (cursor <= end) {
      months.push(monthKey(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }

  function getStatsRangeConfig(expenses = [], range = "6m", now = new Date()) {
    let start = addMonths(now, -5);
    let end = new Date(now.getFullYear(), now.getMonth(), 1);

    if (range === "12m") start = addMonths(now, -11);
    if (range === "24m") start = addMonths(now, -23);
    if (range === "thisYear") start = new Date(now.getFullYear(), 0, 1);
    if (range === "lastYear") {
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 1);
    }
    if (range === "all") {
      const timestamps = expenses
        .map((item) => new Date(item?.date).getTime())
        .filter(Number.isFinite);
      const first = timestamps.length ? new Date(Math.min(...timestamps)) : now;
      start = new Date(first.getFullYear(), first.getMonth(), 1);
    }

    const months = monthsBetween(start, end);
    const previousStart = addMonths(start, -months.length);
    const previousEnd = addMonths(start, -1);
    return {
      months,
      previousMonths: monthsBetween(previousStart, previousEnd),
    };
  }

  function normalizeExpense(item, uncategorized = "未分類") {
    if (!item || item.type !== "支出") return null;
    const month = typeof item.date === "string" ? item.date.slice(0, 7) : "";
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
    const amount = Number.parseFloat(item.price);
    if (!Number.isFinite(amount)) return null;
    return {
      item,
      month,
      amount,
      currency: item.currency || "¥",
      category: item.mainCat || uncategorized,
    };
  }

  return { addMonths, getStatsRangeConfig, monthKey, monthsBetween, normalizeExpense };
});
