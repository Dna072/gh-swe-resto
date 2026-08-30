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
    expect(t("home.hero.subtitle")).not.toMatch(/boka bord/i);
    expect(t("cart.eyebrow")).toBe("Din order");
    expect(t("checkout.eyebrow")).toBe("Kassa");
  });

  it("describes an online restaurant without table booking", () => {
    const t = createTranslator("en");
    expect(t("home.hero.subtitle")).toMatch(/delivery or pickup/i);
    expect(t("home.hero.subtitle")).not.toMatch(/book the table/i);
    expect(t("cart.eyebrow")).toBe("Your order");
    expect(t("checkout.eyebrow")).toBe("Checkout");
    expect(t("order.eyebrow")).toBe("Your order");
  });
});
