import assert from "node:assert/strict";
import test from "node:test";
import { optimizeKnapsack } from "./knapsack.ts";

const demoItems = [
  { id: "laptop", name: "Laptop accessory", cost: 4000, value: 9 },
  { id: "chair", name: "Office chair", cost: 5000, value: 10 },
  { id: "license", name: "Software license", cost: 3000, value: 6 },
  { id: "storage", name: "Storage device", cost: 2000, value: 4 },
];

test("demo dataset returns the expected optimal selection", () => {
  const result = optimizeKnapsack(demoItems, 10000);
  assert.equal(result.totalValue, 20);
  assert.equal(result.totalCost, 10000);
  assert.deepEqual(result.selectedIds, ["chair", "license", "storage"]);
  assert.equal(result.remainingBudget, 0);
  assert.equal(result.utilizationPercent, 100);
});

test("empty inputs and zero budget return an empty selection", () => {
  assert.equal(optimizeKnapsack([], 100).totalValue, 0);
  assert.deepEqual(optimizeKnapsack(demoItems, 0).selectedIds, []);
});

test("items above capacity are not selected and budget is never exceeded", () => {
  const result = optimizeKnapsack(demoItems, 1999);
  assert.deepEqual(result.selectedIds, []);
  assert.ok(result.totalCost <= 1999);
});

test("selected items occur once and reported utility matches their sum", () => {
  const result = optimizeKnapsack(demoItems, 10000);
  assert.equal(new Set(result.selectedIds).size, result.selectedIds.length);
  assert.equal(
    result.totalValue,
    demoItems
      .filter((item) => result.selectedIds.includes(item.id))
      .reduce((sum, item) => sum + item.value, 0),
  );
});

test("ties choose a valid optimum deterministically", () => {
  const items = [
    { id: "first", name: "First", cost: 5, value: 7 },
    { id: "second", name: "Second", cost: 5, value: 7 },
  ];
  const result = optimizeKnapsack(items, 5);
  assert.equal(result.totalValue, 7);
  assert.deepEqual(result.selectedIds, ["first"]);
});

test("invalid budget and item data are rejected", () => {
  assert.throws(() => optimizeKnapsack(demoItems, -1), /Budget/);
  assert.throws(
    () => optimizeKnapsack([{ id: "bad", name: "Bad", cost: 0, value: 1 }], 10),
    /Cost/,
  );
  assert.throws(
    () =>
      optimizeKnapsack([{ id: "bad", name: "Bad", cost: 1, value: -1 }], 10),
    /Utility/,
  );
  assert.throws(
    () =>
      optimizeKnapsack(
        [
          {
            id: "unsafe",
            name: "Unsafe",
            cost: 1,
            value: Number.MAX_SAFE_INTEGER + 1,
          },
        ],
        10,
      ),
    /Utility/,
  );
  assert.throws(
    () =>
      optimizeKnapsack(
        [
          { id: "one", name: "One", cost: 1, value: Number.MAX_SAFE_INTEGER },
          { id: "two", name: "Two", cost: 1, value: 1 },
        ],
        10,
      ),
    /safe integer limit/,
  );
});

test("oversized full DP tables fail before allocation", () => {
  const items = Array.from({ length: 200 }, (_, index) => ({
    id: `item-${index}`,
    name: `Item ${index}`,
    cost: 1,
    value: 1,
  }));
  assert.throws(
    () => optimizeKnapsack(items, 25000),
    /full DP table is limited/,
  );
});

test("small randomized datasets match exhaustive enumeration", () => {
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let sample = 0; sample < 40; sample += 1) {
    const items = Array.from(
      { length: 1 + Math.floor(random() * 8) },
      (_, index) => ({
        id: `item-${index}`,
        name: `Item ${index}`,
        cost: 1 + Math.floor(random() * 15),
        value: Math.floor(random() * 20),
      }),
    );
    const budget = Math.floor(random() * 35);
    const expected = Array.from({ length: 1 << items.length }, (_, mask) => {
      const cost = items.reduce(
        (sum, item, index) => sum + (mask & (1 << index) ? item.cost : 0),
        0,
      );
      const value = items.reduce(
        (sum, item, index) => sum + (mask & (1 << index) ? item.value : 0),
        0,
      );
      return cost <= budget ? value : 0;
    }).reduce((best, value) => Math.max(best, value), 0);
    const result = optimizeKnapsack(items, budget);
    assert.equal(result.totalValue, expected);
    assert.ok(result.totalCost <= budget);
  }
});
