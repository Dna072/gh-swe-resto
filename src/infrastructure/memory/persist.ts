import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { HomepageContent } from "@/domains/content/models";
import type { MenuItem } from "@/domains/menu/models";
import type { MemoryState } from "./state";

export type PersistedCatalog = {
  items: MenuItem[];
  homepage?: HomepageContent;
};

export function catalogPersistPath(): string {
  // Static segments only. A dynamic env path makes Next.js standalone trace
  // the entire working directory into the Cloud Run image.
  return path.join(process.cwd(), "data", "local-catalog.json");
}

export function shouldPersistLocalCatalog(): boolean {
  return process.env.NODE_ENV !== "test" && process.env.VITEST !== "true";
}

export function loadPersistedCatalog(filePath = catalogPersistPath()): PersistedCatalog | null {
  if (!existsSync(filePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as PersistedCatalog;
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
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
  const filePath = options?.filePath ?? catalogPersistPath();
  if (!existsSync(filePath)) {
    return;
  }
  const mtime = statSync(filePath).mtimeMs;
  if (mtime === lastLoadedMtime) {
    return;
  }
  const persisted = loadPersistedCatalog(filePath);
  if (!persisted) {
    return;
  }
  applyPersistedCatalog(state, persisted);
  lastLoadedMtime = mtime;
}

export function persistCatalog(state: MemoryState, filePath = catalogPersistPath()): void {
  const dest = path.dirname(filePath);
  mkdirSync(dest, { recursive: true });
  const payload: PersistedCatalog = {
    items: state.items,
    homepage: state.homepage,
  };
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  lastLoadedMtime = statSync(filePath).mtimeMs;
}
