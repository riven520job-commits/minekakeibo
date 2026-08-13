(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.UISecurity = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function encodeInlineValue(value = "") {
    return encodeURIComponent(String(value)).replace(/'/g, "%27");
  }

  function safeCategoryColor(value, fallback = "#f3f4f6") {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""))
      ? String(value)
      : fallback;
  }

  function isSafeDataImage(value) {
    return /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/]+={0,2}$/i.test(
      String(value || ""),
    );
  }

  return { encodeInlineValue, isSafeDataImage, safeCategoryColor };
});
