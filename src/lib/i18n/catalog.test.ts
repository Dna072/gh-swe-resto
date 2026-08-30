import { describe, expect, it } from "vitest";
import { createTranslator } from "./messages";
import {
  localizeCategoryName,
  localizeMenuDescription,
  localizeMenuName,
  localizeOptionName,
  localizePublicItem,
} from "./catalog";
import type { PublicMenuItem } from "@/lib/menu/public";

describe("catalog locale dictionaries", () => {
  it("returns English and Swedish names from the same item id", () => {
    expect(localizeMenuName("jollof", "Jollof Rice", "en")).toBe("Jollof Rice");
    expect(localizeMenuName("jollof", "Jollof Rice", "sv")).toBe("Jollofris");
    expect(localizeMenuDescription("fufu-light", "Fufu with light soup", "sv")).toBe("Fufu med ljus soppa");
    expect(localizeOptionName("chicken", "Chicken", "sv")).toBe("Kyckling");
    expect(localizeOptionName("chicken", "Chicken", "en")).toBe("Chicken");
  });

  it("localizes a public item including modifiers and category", () => {
    const t = createTranslator("sv");
    const item = localizePublicItem(
      {
        id: "jollof",
        slug: "jollof-rice",
        name: "Jollof Rice",
        shortDescription: "Smoky Ghanaian jollof",
        description: "One-pot tomato rice.",
        categoryId: "plates",
        categoryName: "Today's plates",
        imageAlt: "Jollof Rice",
        modifierGroups: [
          {
            id: "protein",
            name: "Protein",
            required: true,
            minSelections: 1,
            maxSelections: 1,
            options: [{ id: "chicken", name: "Chicken", priceOre: 0, priceLabel: "", allowsQuantity: false }],
          },
        ],
      } as PublicMenuItem,
      "sv",
      t,
    );

    expect(item.name).toBe("Jollofris");
    expect(item.categoryName).toBe(t("category.plates"));
    expect(item.modifierGroups[0]?.name).toBe("Protein");
    expect(item.modifierGroups[0]?.options[0]?.name).toBe("Kyckling");
    expect(localizeCategoryName("plates", "Today's plates", t)).toBe(t("category.plates"));
  });
});
