# Budget Optimizer

A local-first 0/1 Knapsack budget planner built with React, Vite, and a pure TypeScript dynamic programming engine.

## Run locally

```sh
cd budget-optimizer
npm install
npm run dev
```

Open the local URL printed by Vite. The app has no backend or account requirement. Demo items are loaded on launch; edit the budget or candidate list and select **Calculate optimal selection** to run the optimizer.

## Verify

```sh
npm test
npm run lint
npm run build
```

The algorithm tests use Node's built-in test runner and TypeScript type stripping. Use Node.js 22.12 or newer for the included test command; Vite 8 also supports Node.js 20.19 or newer.

## Algorithm

For each item and integer capacity, the full dynamic programming table compares excluding the current item with including it once when it fits. Backtracking returns one optimal set. On ties, the implementation keeps the previous row and excludes the current item. The table is capped at 5,000,000 cells to bound memory use; the UI budget is capped at ₹25,000.

Time and full-table space complexity are O(nW), where W is the numeric budget capacity. Utility scores are illustrative and are not financial returns.
