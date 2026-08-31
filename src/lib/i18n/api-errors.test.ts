import { describe, expect, it } from "vitest";
import { customerErrorMessage } from "./api-errors";
import { createTranslator } from "./messages";

describe("customerErrorMessage", () => {
  it("maps API codes to the active locale", () => {
    const sv = createTranslator("sv");
    const en = createTranslator("en");
    expect(customerErrorMessage("DELIVERY_UNAVAILABLE", sv)).toBe(sv("delivery.no"));
    expect(customerErrorMessage("OUT_OF_ZONE", en)).toBe(en("delivery.no"));
    expect(customerErrorMessage("SLOT_UNAVAILABLE", sv)).toBe(sv("checkout.needSlot"));
    expect(customerErrorMessage("NOT_FOUND", en)).toBe(en("errors.notFound"));
    expect(customerErrorMessage("UNKNOWN_CODE", sv, "cart.priceError")).toBe(sv("cart.priceError"));
  });
});
