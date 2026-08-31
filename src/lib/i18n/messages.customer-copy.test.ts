import { describe, expect, it } from "vitest";
import { en, sv } from "./messages";

const developerSpeak = [
  /source of truth/i,
  /on the server/i,
  /priced by the server/i,
  /resolved on the server/i,
  /quoted on the server/i,
  /placeholder/i,
  /demo catalog/i,
  /this demo/i,
  /phase \d/i,
  /mocked/i,
  /before launch/i,
  /access token/i,
  /preparing service/i,
  /photo coming soon/i,
  /platshåll/i,
  /servern är/i,
  /\bservern\b/i,
  /demokatalog/i,
  /fas \d/i,
  /mockade/i,
  /före lansering/i,
  /åtkomstkod/i,
  /förhandsvisning/i,
  /foto kommer snart/i,
];

describe("customer-facing copy", () => {
  it("keeps English and Swedish keys aligned", () => {
    expect(Object.keys(sv).sort()).toEqual(Object.keys(en).sort());
  });

  it("does not speak in developer or demo language", () => {
    for (const [key, value] of Object.entries({ ...en, ...sv })) {
      for (const pattern of developerSpeak) {
        expect(value, `${key} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it("describes signature plates and kitchen hours instead of photo placeholders", () => {
    expect(en["home.featured.description"]).toMatch(/jollof/i);
    expect(en["home.today.description"]).toMatch(/11\.00/);
    expect(en["home.today.description"]).not.toMatch(/weekday or weekend/i);
    expect(sv["home.featured.description"]).toMatch(/jollof/i);
    expect(sv["home.today.description"]).toMatch(/11\.00/);
  });
});
