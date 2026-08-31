import { describe, expect, it } from "vitest";
import { photonLanguage } from "./photon";

describe("Photon language", () => {
  it("never sends unsupported Swedish lang=sv", () => {
    expect(photonLanguage("sv")).toBe("default");
    expect(photonLanguage()).toBe("default");
    expect(photonLanguage("en")).toBe("en");
  });
});
