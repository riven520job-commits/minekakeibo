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

  function isBudgetPayload(payload) {
    return !!(
      payload &&
      typeof payload === "object" &&
      Array.isArray(payload.data) &&
      (!payload.userAccounts || Array.isArray(payload.userAccounts))
    );
  }

  function utf8Bytes(value) {
    const text = String(value || "");
    if (typeof TextEncoder !== "undefined")
      return new TextEncoder().encode(text).length;
    return text.length * 2;
  }

  return { isBudgetPayload, readJSON, safeParse, utf8Bytes };
});
