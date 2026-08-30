import { createRequire } from "node:module";

const loadPackage = createRequire(import.meta.url);

/** Load a Node package at call time so page imports do not evaluate GCP SDKs. */
export function loadRuntimePackage<T>(id: string): T {
  return loadPackage(id) as T;
}
