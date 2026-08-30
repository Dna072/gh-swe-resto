import { describe, expect, it } from "vitest";
import { defaultMealAltText, mealUploadIssue } from "./meal-upload";

describe("meal upload guidance", () => {
  it("asks to save the meal before a photograph", () => {
    expect(mealUploadIssue({ file: new File(["x"], "plate.jpg"), altText: "Jollof plated" })).toMatch(
      /save the meal/i,
    );
  });

  it("asks for a file when none is chosen", () => {
    expect(mealUploadIssue({ mealId: "jollof", file: null, altText: "Jollof plated" })).toMatch(
      /choose a photograph/i,
    );
  });

  it("asks for alt text", () => {
    expect(
      mealUploadIssue({ mealId: "jollof", file: new File(["x"], "plate.jpg"), altText: "  " }),
    ).toMatch(/alt text/i);
  });

  it("builds a default alt from the meal name", () => {
    expect(defaultMealAltText("Jollof Rice")).toBe("Jollof Rice plated");
  });
});
