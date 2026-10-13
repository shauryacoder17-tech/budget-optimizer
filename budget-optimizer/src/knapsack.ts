export interface KnapsackItem {
  id: string;
  name: string;
  cost: number;
  value: number;
}

export interface KnapsackResult {
  selectedIds: string[];
  totalCost: number;
  totalValue: number;
  remainingBudget: number;
  utilizationPercent: number;
  table: number[][];
}

export const MAX_BUDGET = 25_000;
export const MAX_DP_CELLS = 5_000_000;

export function optimizeKnapsack(
  items: KnapsackItem[],
  budget: number,
): KnapsackResult {
  if (!Number.isSafeInteger(budget) || budget < 0 || budget > MAX_BUDGET) {
    throw new Error(
      `Budget must be a whole number from 0 to ${MAX_BUDGET.toLocaleString("en-IN")}.`,
    );
  }
  if (!Array.isArray(items)) {
    throw new Error("Items must be provided as a list.");
  }

  const tableCells = (items.length + 1) * (budget + 1);
  if (tableCells > MAX_DP_CELLS) {
    throw new Error(
      `The full DP table is limited to ${MAX_DP_CELLS.toLocaleString("en-IN")} cells. Reduce the item count or budget.`,
    );
  }

  const seenIds = new Set<string>();
  let maximumPossibleValue = 0;
  for (const item of items) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      seenIds.has(item.id)
    ) {
      throw new Error("Every item must have a unique, non-empty identifier.");
    }
    seenIds.add(item.id);
    if (typeof item.name !== "string" || !item.name.trim()) {
      throw new Error("Every item must have a name.");
    }
    if (!Number.isSafeInteger(item.cost) || item.cost <= 0) {
      throw new Error(
        `Cost for “${item.name}” must be a positive whole number.`,
      );
    }
    if (!Number.isSafeInteger(item.value) || item.value < 0) {
      throw new Error(
        `Utility for “${item.name}” must be a non-negative whole number.`,
      );
    }
    maximumPossibleValue += item.value;
    if (!Number.isSafeInteger(maximumPossibleValue)) {
      throw new Error(
        "The combined utility values exceed JavaScript's safe integer limit.",
      );
    }
  }

  const table = Array.from({ length: items.length + 1 }, () =>
    Array<number>(budget + 1).fill(0),
  );
  for (let row = 1; row <= items.length; row += 1) {
    const item = items[row - 1];
    for (let capacity = 0; capacity <= budget; capacity += 1) {
      const withoutItem = table[row - 1][capacity];
      table[row][capacity] =
        item.cost > capacity
          ? withoutItem
          : Math.max(
              withoutItem,
              item.value + table[row - 1][capacity - item.cost],
            );
    }
  }

  const selectedIds: string[] = [];
  let capacity = budget;
  for (let row = items.length; row > 0; row -= 1) {
    if (table[row][capacity] > table[row - 1][capacity]) {
      const item = items[row - 1];
      selectedIds.push(item.id);
      capacity -= item.cost;
    }
  }
  selectedIds.reverse();

  const selected = items.filter((item) => selectedIds.includes(item.id));
  const totalCost = selected.reduce((sum, item) => sum + item.cost, 0);
  const totalValue = selected.reduce((sum, item) => sum + item.value, 0);

  return {
    selectedIds,
    totalCost,
    totalValue,
    remainingBudget: budget - totalCost,
    utilizationPercent: budget === 0 ? 0 : (totalCost / budget) * 100,
    table,
  };
}
