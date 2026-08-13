const test = require("node:test");
const assert = require("node:assert/strict");
const SearchCore = require("../src/search-core.js");

const records = [
  { name: "コンビニ", merchant: "FamilyMart", note: "朝ごはん" },
  { name: "午餐", merchant: "全家", note: "公司附近" },
  { name: "電車", merchant: "JR East", note: "" },
];

test("normalizes width, case, and surrounding whitespace", () => {
  assert.equal(SearchCore.normalizeSearchText("  ＦＡＭＩＬＹ Mart  "), "family mart");
});

test("matches every token across searchable record fields", () => {
  const result = SearchCore.filterRecords(records, "family 朝ごはん");
  assert.deepEqual(result, [records[0]]);
});

test("supports custom field extraction and empty queries", () => {
  const wrapped = records.map((item, index) => ({ item, index }));
  assert.deepEqual(
    SearchCore.filterRecords(wrapped, "全家", (pair) => Object.values(pair.item)),
    [wrapped[1]],
  );
  assert.deepEqual(SearchCore.filterRecords(records, "  "), records);
});
