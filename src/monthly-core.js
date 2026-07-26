(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MonthlyCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function parseMonthKey(monthKey) {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(String(monthKey || ""));
    if (!match) return null;
    return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
  }

  function formatDate(year, monthIndex, day) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function buildMonthCalendar(monthKey) {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) return [];
    const { year, monthIndex } = parsed;
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const cellCount = firstWeekday + lastDay > 35 ? 42 : 35;

    return Array.from({ length: cellCount }, (_, index) => {
      const relativeDay = index - firstWeekday + 1;
      const date = new Date(year, monthIndex, relativeDay);
      const cellYear = date.getFullYear();
      const cellMonth = date.getMonth();
      return {
        date: formatDate(cellYear, cellMonth, date.getDate()),
        day: date.getDate(),
        weekday: date.getDay(),
        inMonth: cellYear === year && cellMonth === monthIndex,
      };
    });
  }

  function groupRecordsByDate(records = []) {
    return records.reduce((groups, record) => {
      const item = record?.item || record;
      const date = typeof item?.date === "string" ? item.date.slice(0, 10) : "";
      if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date))
        return groups;
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
      return groups;
    }, {});
  }

  function defaultSelectedDate(monthKey, groupedRecords = {}, today = "") {
    if (String(today).slice(0, 7) === monthKey) return today;
    const firstRecordDate = Object.keys(groupedRecords)
      .filter((date) => date.slice(0, 7) === monthKey)
      .sort()[0];
    return firstRecordDate || `${monthKey}-01`;
  }

  function scheduleOccurrenceDate(schedule, monthKey) {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) return "";
    const day = Math.max(1, Math.min(31, Number(schedule?.billingDay) || 1));
    const lastDay = new Date(parsed.year, parsed.monthIndex + 1, 0).getDate();
    return formatDate(parsed.year, parsed.monthIndex, Math.min(day, lastDay));
  }

  function buildScheduleOccurrences(
    schedules = [],
    monthKey,
    records = [],
    today = "",
  ) {
    if (!parseMonthKey(monthKey)) return [];
    return schedules
      .filter((schedule) => {
        if (!schedule || schedule.enabled === false) return false;
        const startMonth = String(schedule.startMonth || "").slice(0, 7);
        const endMonth = String(schedule.endMonth || "").slice(0, 7);
        return (!startMonth || startMonth <= monthKey) && (!endMonth || endMonth >= monthKey);
      })
      .map((schedule) => {
        const date = scheduleOccurrenceDate(schedule, monthKey);
        const recordIndex = records.findIndex(
          (record) =>
            record?.scheduleId === schedule.id &&
            (record.scheduleOccurrenceDate || record.date) === date,
        );
        return {
          schedule,
          date,
          status: recordIndex >= 0 ? "paid" : date < today ? "overdue" : "scheduled",
          recordIndex,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.schedule.name).localeCompare(String(b.schedule.name)));
  }

  function matchesFilters(item = {}, filters = {}) {
    if (filters.account && item.account !== filters.account) return false;
    if (filters.category && item.mainCat !== filters.category) return false;
    if (filters.project && (item.projectId || "") !== filters.project) return false;
    return true;
  }

  function filterRecordPairs(records = [], filters = {}) {
    return records.filter((record) => matchesFilters(record?.item || record, filters));
  }

  function filterOccurrences(occurrences = [], filters = {}) {
    return occurrences.filter(({ schedule }) => matchesFilters(schedule, filters));
  }

  function getScheduleReminders(occurrences = [], today = "", daysAhead = 3) {
    const todayDate = new Date(`${today}T00:00:00`);
    if (!Number.isFinite(todayDate.getTime())) return [];
    const limit = new Date(todayDate);
    limit.setDate(limit.getDate() + Math.max(0, Number(daysAhead) || 0));
    const limitDate = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, "0")}-${String(limit.getDate()).padStart(2, "0")}`;
    return occurrences.filter(
      (occurrence) =>
        occurrence.status !== "paid" &&
        occurrence.date <= limitDate,
    );
  }

  function recurringLabel(item = {}) {
    return String(item.name || item.subCatName || item.mainCat || "")
      .trim()
      .toLocaleLowerCase();
  }

  function detectRecurringCandidates(records = [], schedules = []) {
    const existing = new Set(
      schedules.map(
        (schedule) =>
          `${recurringLabel(schedule)}|${schedule.account || ""}|${schedule.currency || "¥"}`,
      ),
    );
    const groups = new Map();
    records.forEach((item) => {
      if (
        !item ||
        item.scheduleId ||
        !["支出", "應付帳款"].includes(item.type)
      )
        return;
      const label = recurringLabel(item);
      const amount = Number.parseFloat(item.price);
      const date = String(item.date || "").slice(0, 10);
      if (
        !label ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
      )
        return;
      const key = `${label}|${item.account || ""}|${item.currency || "¥"}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ item, amount, date });
    });

    return [...groups.entries()]
      .filter(([key]) => !existing.has(key))
      .map(([, entries]) => {
        const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
        const months = new Set(sorted.map((entry) => entry.date.slice(0, 7)));
        if (months.size < 3) return null;
        const amounts = sorted.map((entry) => entry.amount).sort((a, b) => a - b);
        const median = amounts[Math.floor(amounts.length / 2)];
        const amountTolerance = Math.max(1, median * 0.08);
        if (amounts.some((amount) => Math.abs(amount - median) > amountTolerance))
          return null;
        const days = sorted.map((entry) => Number(entry.date.slice(8, 10)));
        if (Math.max(...days) - Math.min(...days) > 5) return null;
        const latest = sorted.at(-1).item;
        return {
          name: latest.name || latest.subCatName || latest.mainCat,
          amount: median,
          currency: latest.currency || "¥",
          billingDay: Math.round(
            days.reduce((sum, day) => sum + day, 0) / days.length,
          ),
          account: latest.account || "",
          mainCat: latest.mainCat || "固定支出",
          projectId: latest.projectId || "",
          icon: latest.subCatIcon || "custom:訂閱",
          count: sorted.length,
          monthCount: months.size,
          lastDate: sorted.at(-1).date,
        };
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.monthCount - a.monthCount ||
          b.count - a.count ||
          b.lastDate.localeCompare(a.lastDate),
      );
  }

  return {
    buildMonthCalendar,
    buildScheduleOccurrences,
    detectRecurringCandidates,
    defaultSelectedDate,
    filterOccurrences,
    filterRecordPairs,
    getScheduleReminders,
    groupRecordsByDate,
    matchesFilters,
    parseMonthKey,
    scheduleOccurrenceDate,
  };
});
