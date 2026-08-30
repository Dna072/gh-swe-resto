import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { defaultHomepageContent } from "@/domains/content/defaults";
import type { MenuItem } from "@/domains/menu/models";
import { applyPersistedCatalog, persistCatalog } from "./persist";
import { createMemoryState } from "./state";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function sampleItem(id: string, name: string): MenuItem {
  return {
    restaurantId: "uppsala-main",
    id,
    slug: id,
    name,
    description: "desc",
    shortDescription: "short",
    images: [
      {
        id: `${id}-photo`,
        storagePath: `restaurants/uppsala-main/menu/${id}/photo-card.webp`,
        url: `/api/media/restaurants/uppsala-main/menu/${id}/photo-card.webp`,
        alt: `${name} plate`,
        altText: `${name} plate`,
        isPrimary: true,
        sortOrder: 0,
        status: "ACTIVE",
      },
    ],
    categoryId: "plates",
    basePriceOre: 12900,
    currency: "SEK",
    availableDays: ["monday"],
    isAvailable: true,
    isFeatured: false,
    isPopular: false,
    inventoryTracked: false,
    preparationTimeMinutes: 20,
    allergens: [],
    dietaryTags: [],
    modifierGroupIds: [],
    kitchenPortions: [],
    displayOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("local catalog persist", () => {
  it("writes and reloads meal photographs onto the seed catalog", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "catalog-"));
    tempDirs.push(dir);
    const filePath = path.join(dir, "local-catalog.json");
    const seed = sampleItem("jollof", "Jollof Rice");
    seed.images = [];
    const state = createMemoryState({
      items: [seed],
      homepage: defaultHomepageContent("uppsala-main"),
    });
    const uploaded = sampleItem("jollof", "Jollof Rice");
    persistCatalog({ ...state, items: [uploaded] }, filePath);

    const saved = JSON.parse(readFileSync(filePath, "utf8")) as { items: MenuItem[] };
    expect(saved.items[0]?.images[0]?.url).toContain("/api/media/");

    applyPersistedCatalog(state, { items: [uploaded] });
    expect(state.items[0]?.images[0]?.url).toContain("jollof/photo-card.webp");
  });
});
