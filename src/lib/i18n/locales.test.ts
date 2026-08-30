import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, detectLocaleFromAcceptLanguage } from "./locales";
import { createTranslator } from "./messages";

describe("detectLocaleFromAcceptLanguage", () => {
  it("defaults to Swedish when the header is missing", () => {
    expect(detectLocaleFromAcceptLanguage(null)).toBe(DEFAULT_LOCALE);
    expect(detectLocaleFromAcceptLanguage("")).toBe("sv");
  });

  it("uses English when it is the preferred browser language", () => {
    expect(detectLocaleFromAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(detectLocaleFromAcceptLanguage("en-GB,en;q=0.8,sv;q=0.4")).toBe("en");
  });

  it("uses Swedish when it ranks above English", () => {
    expect(detectLocaleFromAcceptLanguage("sv-SE,sv;q=0.9,en;q=0.8")).toBe("sv");
  });

  it("falls back to Swedish for unsupported languages", () => {
    expect(detectLocaleFromAcceptLanguage("de-DE,de;q=0.9,fr;q=0.8")).toBe("sv");
  });
});

describe("translator", () => {
  it("interpolates Swedish copy", () => {
    const t = createTranslator("sv");
    expect(t("delivery.yes", { zone: "Uppsala centrum", fee: "49,00 kr", eta: 35 })).toContain(
      "Uppsala centrum",
    );
    expect(t("home.hero.title")).toMatch(/Ghanansk/i);
  });

  it("keeps English and Swedish dictionaries aligned", () => {
    const en = createTranslator("en");
    const sv = createTranslator("sv");
    expect(en("brand.restaurant")).toBe("Restaurant");
    expect(sv("brand.restaurant")).toBe("Restaurang");
    expect(en("errors.notFound")).not.toBe(sv("errors.notFound"));
  });
});
