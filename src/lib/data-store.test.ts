import { describe, expect, it } from "vitest";
import { loadEnv } from "./env";
import { firestoreDataStoreEnabled } from "./data-store";

describe("firestoreDataStoreEnabled", () => {
  it("stays on memory unless Firestore is requested", () => {
    const env = loadEnv({ NODE_ENV: "test", APP_ENV: "test" });
    expect(firestoreDataStoreEnabled(env, {})).toBe(false);
  });

  it("uses Firestore on Cloud Run when a project id is set", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      GOOGLE_CLOUD_PROJECT: "ghana-restaurant-dev",
    });
    expect(firestoreDataStoreEnabled(env, { K_SERVICE: "ghana-restaurant-showcase" })).toBe(true);
  });

  it("can be forced back to memory", () => {
    const env = loadEnv({
      NODE_ENV: "production",
      APP_ENV: "staging",
      DATA_STORE: "memory",
      GOOGLE_CLOUD_PROJECT: "ghana-restaurant-dev",
    });
    expect(firestoreDataStoreEnabled(env, { K_SERVICE: "ghana-restaurant-showcase" })).toBe(false);
  });
});
