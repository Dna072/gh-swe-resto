import { describe, expect, it } from "vitest";
import { extractPostalCode, parsePostalCodes } from "./postal";

describe("postal helpers", () => {
  it("parses mixed Swedish postcode lists", () => {
    expect(parsePostalCodes("75322, 753 24\n75424")).toEqual(["75322", "75324", "75424"]);
  });

  it("reads a postcode from a typed address line", () => {
    expect(extractPostalCode("Kantorsgatan 80, 75424, Uppsala")).toBe("75424");
    expect(extractPostalCode("Kantorsgatan 80, 754 24 Uppsala")).toBe("75424");
  });

  it("ignores the storefront 00000 placeholder", () => {
    expect(extractPostalCode("Kantorsgatan 80, 75424, Uppsala", "00000")).toBe("75424");
    expect(extractPostalCode("Kantorsgatan 80", "00000")).toBeUndefined();
    expect(parsePostalCodes("00000, 75322")).toEqual(["75322"]);
  });
});
