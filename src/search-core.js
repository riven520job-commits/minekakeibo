(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SearchCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function normalizeSearchText(value) {
    return String(value ?? "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function searchTokens(query) {
    return normalizeSearchText(query).split(" ").filter(Boolean);
  }

  function filterRecords(records, query, fieldsForRecord) {
    const source = Array.isArray(records) ? records : [];
    const tokens = searchTokens(query);
    if (!tokens.length) return [...source];
    const getFields =
      typeof fieldsForRecord === "function"
        ? fieldsForRecord
        : (record) => Object.values(record || {});
    return source.filter((record) => {
      const fields = getFields(record);
      const haystack = normalizeSearchText(
        (Array.isArray(fields) ? fields : [fields]).join(" "),
      );
      return tokens.every((token) => haystack.includes(token));
    });
  }

  return { filterRecords, normalizeSearchText, searchTokens };
});
