(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StorageCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function cloneFallback(fallback) {
    if (Array.isArray(fallback)) return [...fallback];
    if (fallback && typeof fallback === "object") return { ...fallback };
    return fallback;
  }

  function safeParse(value, fallback) {
    if (value === null || value === undefined || value === "")
      return cloneFallback(fallback);
    try {
      return JSON.parse(value);
    } catch {
      return cloneFallback(fallback);
    }
  }

  function readJSON(storage, key, fallback) {
    let raw = null;
    try {
      raw = storage?.getItem(key);
    } catch {
      return cloneFallback(fallback);
    }
    if (!raw) return cloneFallback(fallback);
    try {
      return JSON.parse(raw);
    } catch {
      try {
        storage?.setItem(
          `${key}:corrupt:${Date.now()}`,
          String(raw).slice(0, 500000),
        );
      } catch {
        // Recovery must never prevent app startup.
      }
      return cloneFallback(fallback);
    }
  }

  const ARRAY_FIELDS = [
    "data",
    "merchantFavorites",
    "userAccounts",
    "budgetProjects",
    "recurringSchedules",
    "accountGroups",
    "customMainCategories",
  ];
  const OBJECT_FIELDS = [
    "accountInitials",
    "accountCurrencies",
    "exchangeRates",
    "accountGroupMap",
    "accountGroupCollapsed",
    "accountSettings",
    "customCategories",
    "settings",
  ];

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function isIsoCalendarDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));
    if (!match) return false;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }

  function validateBudgetPayload(payload) {
    const errors = [];
    if (!isPlainObject(payload)) return { valid: false, errors: ["payload"] };
    if (!Array.isArray(payload.data)) errors.push("data");
    if (
      payload.version !== undefined &&
      (!Number.isInteger(payload.version) || payload.version < 1)
    )
      errors.push("version");
    if (payload.savedAt !== undefined && !Number.isFinite(Date.parse(payload.savedAt)))
      errors.push("savedAt");
    ARRAY_FIELDS.slice(1).forEach((field) => {
      if (payload[field] !== undefined && !Array.isArray(payload[field]))
        errors.push(field);
    });
    OBJECT_FIELDS.forEach((field) => {
      if (payload[field] !== undefined && !isPlainObject(payload[field]))
        errors.push(field);
    });
    if (Array.isArray(payload.data)) {
      payload.data.forEach((record, index) => {
        if (!isPlainObject(record)) {
          errors.push(`data[${index}]`);
          return;
        }
        if (
          record.date !== undefined &&
          !isIsoCalendarDate(record.date)
        )
          errors.push(`data[${index}].date`);
        if (
          record.price !== undefined &&
          (String(record.price).trim() === "" ||
            !Number.isFinite(Number(String(record.price).replace(/,/g, ""))))
        )
          errors.push(`data[${index}].price`);
      });
    }
    return { valid: errors.length === 0, errors };
  }

  function isBudgetPayload(payload) {
    return validateBudgetPayload(payload).valid;
  }

  function utf8Bytes(value) {
    const text = String(value || "");
    if (typeof TextEncoder !== "undefined")
      return new TextEncoder().encode(text).length;
    return text.length * 2;
  }

  return {
    isBudgetPayload,
    readJSON,
    safeParse,
    utf8Bytes,
    validateBudgetPayload,
  };
});
