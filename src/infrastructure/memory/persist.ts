import fs from "node:fs";
import path from "node:path";
import type { HomepageContent } from "@/domains/content/models";
import type { MenuItem } from "@/domains/menu/models";
import type { MemoryState } from "./state";

export type PersistedCatalog = {
  items: MenuItem[];
  homepage?: HomepageContent;
};

/** Always `cwd/data/local-catalog.json` — static segments for Next.js tracing. */
export function catalogPersistPath(): string {
  return path.join(process.cwd(), "data", "local-catalog.json");
}

export function shouldPersistLocalCatalog(): boolean {
  return process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";
}

function readCatalogFromDisk(filePath: string): PersistedCatalog | null {
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
      return null;
    }
    const parsed = JSON.parse(
      fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf8"),
    ) as PersistedCatalog;
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadPersistedCatalog(filePath?: string): PersistedCatalog | null {
  return readCatalogFromDisk(filePath ?? catalogPersistPath());
}

export function applyPersistedCatalog(state: MemoryState, persisted: PersistedCatalog): void {
  const byId = new Map(persisted.items.map((item) => [item.id, item]));
  state.items = state.items.map((item) => byId.get(item.id) ?? item);
  for (const item of persisted.items) {
    if (!state.items.some((existing) => existing.id === item.id)) {
      state.items.push(item);
    }
  }
  if (persisted.homepage) {
    state.homepage = persisted.homepage;
  }
}

let lastLoadedMtime = 0;

export function resetPersistCache(): void {
  lastLoadedMtime = 0;
}

export function refreshPersistedCatalog(
  state: MemoryState,
  options?: { filePath?: string; force?: boolean },
): void {
  if (!options?.force && !shouldPersistLocalCatalog()) {
    return;
  }
  const filePath = options?.filePath ?? path.join(process.cwd(), "data", "local-catalog.json");
  if (!fs.existsSync(/*turbopackIgnore: true*/ filePath)) {
    return;
  }
  const mtime = fs.statSync(/*turbopackIgnore: true*/ filePath).mtimeMs;
  if (mtime === lastLoadedMtime) {
    return;
  }
  const persisted = readCatalogFromDisk(filePath);
  if (!persisted) {
    return;
  }
  applyPersistedCatalog(state, persisted);
  lastLoadedMtime = mtime;
}

export function persistCatalog(state: MemoryState, filePath?: string): void {
  const dest = filePath ?? path.join(process.cwd(), "data", "local-catalog.json");
  fs.mkdirSync(/*turbopackIgnore: true*/ path.dirname(dest), { recursive: true });
  const payload: PersistedCatalog = {
    items: state.items,
    homepage: state.homepage,
  };
  fs.writeFileSync(/*turbopackIgnore: true*/ dest, `${JSON.stringify(payload, null, 2)}\n`);
  lastLoadedMtime = fs.statSync(/*turbopackIgnore: true*/ dest).mtimeMs;
}
