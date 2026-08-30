import { afterEach, describe, expect, it } from "vitest";
import { AppError, publicErrorMessage } from "./errors";

describe("publicErrorMessage", () => {
  const previous = process.env.APP_ENV;

  afterEach(() => {
    process.env.APP_ENV = previous;
  });

  it("keeps AppError text", () => {
    expect(publicErrorMessage(new AppError("VALIDATION", "Choose a photograph."))).toBe(
      "Choose a photograph.",
    );
  });

  it("reveals unexpected errors outside production", () => {
    process.env.APP_ENV = "staging";
    expect(publicErrorMessage(new Error("Cannot find module as expression is too dynamic"))).toBe(
      "Cannot find module as expression is too dynamic",
    );
  });

  it("hides unexpected errors in production", () => {
    process.env.APP_ENV = "production";
    expect(publicErrorMessage(new Error("secret internals"))).toBe(
      "Something went wrong. Please try again.",
    );
  });
});
