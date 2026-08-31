import { describe, expect, it } from "vitest";
import { InMemoryPromotionRepository } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { welcomePromo } from "../../../tests/unit/fixtures";

describe("InMemoryPromotionRepository", () => {
  it("lists and saves promotions by restaurant", async () => {
    const state = createMemoryState({ promotions: [welcomePromo] });
    const repo = new InMemoryPromotionRepository(state);
    const listed = await repo.list(welcomePromo.restaurantId);
    expect(listed.map((item) => item.code)).toEqual(["WELCOME10"]);
    const saved = await repo.save({
      ...welcomePromo,
      id: "weekend",
      code: "weekend20",
      percentOff: 20,
    });
    expect(saved.code).toBe("WEEKEND20");
    expect(await repo.getByCode(welcomePromo.restaurantId, "WEEKEND20")).toMatchObject({ percentOff: 20 });
  });
});
