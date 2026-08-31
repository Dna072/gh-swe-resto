import { describe, expect, it } from "vitest";
import { renderPremiumEmail } from "./templates";

describe("premium email templates", () => {
  it("renders a branded HTML letter with the restaurant mark", () => {
    const rendered = renderPremiumEmail({
      preheader: "Your order is in",
      headline: "We have your order",
      body: "Payment is confirmed.",
      details: [{ label: "Order", value: "GH1048" }],
      ctaLabel: "Follow your order",
      ctaUrl: "https://mfcuisine.se/orders/o1",
    });
    expect(rendered.html).toContain("Meridian Fusion");
    expect(rendered.html).toContain("GH1048");
    expect(rendered.html).toContain("https://mfcuisine.se/orders/o1");
    expect(rendered.html).toContain("#C4A35A");
    expect(rendered.text).toContain("We have your order");
    expect(rendered.text).not.toMatch(/placeholder|demo|server/i);
  });
});
