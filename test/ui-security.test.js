const test = require("node:test");
const assert = require("node:assert/strict");
const UISecurity = require("../src/ui-security.js");

test("encodes apostrophes before values enter inline handlers", () => {
  const encoded = UISecurity.encodeInlineValue("a');alert(1)//");
  assert.equal(encoded.includes("'"), false);
  assert.equal(decodeURIComponent(encoded), "a');alert(1)//");
});

test("only accepts six-digit hexadecimal category colors", () => {
  assert.equal(UISecurity.safeCategoryColor("#A1b2C3"), "#A1b2C3");
  assert.equal(
    UISecurity.safeCategoryColor("red; background:url(javascript:1)"),
    "#f3f4f6",
  );
});

test("allows raster data images and rejects SVG payloads", () => {
  assert.equal(UISecurity.isSafeDataImage("data:image/png;base64,aGVsbG8="), true);
  assert.equal(
    UISecurity.isSafeDataImage("data:image/svg+xml,<svg onload=alert(1) />"),
    false,
  );
});
