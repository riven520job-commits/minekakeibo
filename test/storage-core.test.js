const test = require("node:test");
const assert = require("node:assert/strict");
const StorageCore = require("../src/storage-core.js");

test("safeParse returns parsed values and survives malformed JSON", () => {
  assert.deepEqual(StorageCore.safeParse('{"ok":true}', {}), { ok: true });
  assert.deepEqual(StorageCore.safeParse("{broken", []), []);
});

test("readJSON preserves malformed source for recovery", () => {
  const values = new Map([["budget", "{broken"]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.deepEqual(StorageCore.readJSON(storage, "budget", []), []);
  assert.ok([...values.keys()].some((key) => key.startsWith("budget:corrupt:")));
});

test("validates backup payload shape", () => {
  assert.equal(StorageCore.isBudgetPayload({ data: [] }), true);
  assert.equal(StorageCore.isBudgetPayload({ data: {} }), false);
  assert.equal(StorageCore.isBudgetPayload(null), false);
  assert.equal(
    StorageCore.isBudgetPayload({ data: [], recurringSchedules: {} }),
    false,
  );
  assert.equal(
    StorageCore.isBudgetPayload({ data: [{ date: "2026-08-09", price: "1200" }] }),
    true,
  );
  assert.equal(
    StorageCore.isBudgetPayload({ data: [{ date: "not-a-date", price: "1200" }] }),
    false,
  );
  assert.equal(
    StorageCore.isBudgetPayload({ data: [{ date: "2026-02-30", price: "1200" }] }),
    false,
  );
  assert.equal(
    StorageCore.isBudgetPayload({ data: [{ date: "2026-08-09", price: "abc" }] }),
    false,
  );
});
