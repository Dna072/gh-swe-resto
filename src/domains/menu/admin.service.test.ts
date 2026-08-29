import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { defaultHomepageContent } from "@/domains/content/defaults";
import { MediaService } from "@/domains/media/service";
import { InMemoryMenuRepository } from "@/infrastructure/memory/menu-repository";
import { createMemoryState } from "@/infrastructure/memory/state";
import { seededCatalog } from "@/infrastructure/seed/ghana-menu";
import { LocalObjectStorage } from "@/infrastructure/storage/local-storage";
import { MenuAdminService } from "./admin.service";

describe("MenuAdminService", () => {
  it("saves a meal without a photograph", async () => {
    const catalog = seededCatalog("uppsala-main");
    const repo = new InMemoryMenuRepository(
      createMemoryState({
        categories: catalog.categories,
        items: catalog.items,
        modifierGroups: catalog.modifierGroups,
        inventory: catalog.inventory,
        homepage: defaultHomepageContent("uppsala-main"),
      }),
    );
    const media = new MediaService(new LocalObjectStorage(await mkdtemp(path.join(tmpdir(), "media-"))));
    const admin = new MenuAdminService(repo, media);
    const item = await admin.saveItem("uppsala-main", {
      slug: "test-jollof",
      name: "Test Jollof",
      description: "A development meal without a kitchen photograph yet.",
      shortDescription: "Photo coming soon",
      categoryId: "plates",
      basePriceOre: 12900,
      preparationTimeMinutes: 20,
    });
    expect(item.images).toEqual([]);
    expect(item.name).toBe("Test Jollof");
  });

  it("archives and restores a meal", async () => {
    const catalog = seededCatalog("uppsala-main");
    const repo = new InMemoryMenuRepository(
      createMemoryState({
        categories: catalog.categories,
        items: catalog.items,
        modifierGroups: catalog.modifierGroups,
        inventory: catalog.inventory,
        homepage: defaultHomepageContent("uppsala-main"),
      }),
    );
    const media = new MediaService(new LocalObjectStorage(await mkdtemp(path.join(tmpdir(), "media-"))));
    const admin = new MenuAdminService(repo, media);
    const archived = await admin.setArchived("uppsala-main", "jollof", true);
    expect(archived.archivedAt).toBeTruthy();
    const restored = await admin.setArchived("uppsala-main", "jollof", false);
    expect(restored.archivedAt).toBeUndefined();
  });
});
