/** Integer Swedish öre. 1 SEK = 100 öre. 129 SEK = 12900 öre. */
export type Ore = number;

export const SEK_CURRENCY = "SEK" as const;
export type CurrencyCode = typeof SEK_CURRENCY;

export function assertOre(value: number, label = "amount"): Ore {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer number of öre`);
  }
  return value;
}

export function sekToOre(sek: number): Ore {
  if (!Number.isFinite(sek)) {
    throw new Error("SEK amount must be finite");
  }
  return assertOre(Math.round(sek * 100), "converted SEK");
}

export function oreToSek(ore: Ore): number {
  return assertOre(ore, "öre") / 100;
}

export function formatSek(ore: Ore): string {
  const amount = oreToSek(ore);
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
  }).format(amount);
}

export function addOre(...amounts: Ore[]): Ore {
  return amounts.reduce((sum, amount) => sum + assertOre(amount), 0);
}

export function multiplyOre(unit: Ore, quantity: number): Ore {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new Error("quantity must be a non-negative integer");
  }
  return assertOre(unit) * quantity;
}

export function clampNonNegativeOre(value: Ore): Ore {
  return Math.max(0, assertOre(value));
}

/** `percent` is 20 for 20%. Rounds to the nearest öre. */
export function percentOfOre(amount: Ore, percent: number): Ore {
  if (!Number.isFinite(percent)) {
    throw new Error("percent must be finite");
  }
  return Math.round((assertOre(amount) * percent) / 100);
}
