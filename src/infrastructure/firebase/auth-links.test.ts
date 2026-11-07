import { afterEach, describe, expect, it } from "vitest";
import { ensureFirebaseActionApiKey, isFirebaseAuthConfigError } from "./auth-links";
import { resetEnvCache } from "@/lib/env";

describe("Firebase auth links", () => {
  afterEach(() => {
    delete process.env.FIREBASE_WEB_API_KEY;
    delete process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    resetEnvCache();
  });

  it("injects a missing apiKey from env", () => {
    process.env.FIREBASE_WEB_API_KEY = "test-web-key";
    resetEnvCache();
    const link =
      "https://ghana-restaurant.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=abc&apiKey=&continueUrl=https%3A%2F%2Fexample.com%2Fadmin&lang=en";
    expect(ensureFirebaseActionApiKey(link)).toContain("apiKey=test-web-key");
  });

  it("detects missing Auth configuration errors", () => {
    expect(
      isFirebaseAuthConfigError(new Error("There is no configuration corresponding to the provided identifier.")),
    ).toBe(true);
  });
});
