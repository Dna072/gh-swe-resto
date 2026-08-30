import type { PublicCatalog, PublicMenuItem } from "@/lib/menu/public";
import type { Locale } from "./locales";
import type { MessageKey, Translator } from "./messages";

type CatalogCopy = {
  name: string;
  shortDescription: string;
  description: string;
};

const itemsEn: Record<string, CatalogCopy> = {
  jollof: {
    name: "Jollof Rice",
    shortDescription: "Smoky Ghanaian jollof",
    description:
      "One-pot tomato rice cooked down with onion, ginger and scotch bonnet. Served with your protein and shito.",
  },
  waakye: {
    name: "Waakye",
    shortDescription: "Rice and beans, Accra style",
    description: "Rice and beans steamed with millet leaves, served with salad, spaghetti and your protein.",
  },
  "red-red": {
    name: "Red Red",
    shortDescription: "Bean stew and plantain",
    description: "Black-eyed bean stew in palm oil, finished with crispy fried ripe plantain.",
  },
  "banku-tilapia": {
    name: "Banku & Tilapia",
    shortDescription: "Grilled tilapia with banku",
    description: "Fermented banku with grilled tilapia, onion and pepper sauce. Limited portions each day.",
  },
  "banku-okro": {
    name: "Banku & Okro Soup",
    shortDescription: "Banku with okro",
    description: "Soft banku with a glossy okro soup. Choose chicken or fish.",
  },
  "fufu-light": {
    name: "Fufu & Light Soup",
    shortDescription: "Fufu with light soup",
    description: "Pounded fufu with a clear, aromatic light soup. A Sunday classic, available every day.",
  },
  "fufu-groundnut": {
    name: "Fufu & Groundnut Soup",
    shortDescription: "Fufu with groundnut soup",
    description: "Fufu in a deep, roasted groundnut soup. Please note peanuts.",
  },
  "kenkey-fish": {
    name: "Kenkey & Fish",
    shortDescription: "Ga kenkey with fried fish",
    description: "Fermented kenkey with fried fish and fresh pepper. A coastal plate.",
  },
  "fried-plantain": {
    name: "Fried Plantain",
    shortDescription: "Ripe plantain, fried to order",
    description: "Sweet ripe plantain, fried until the edges caramelise.",
  },
  sobolo: {
    name: "Sobolo",
    shortDescription: "Hibiscus cooler",
    description: "Cold hibiscus drink with ginger and citrus.",
  },
  malt: {
    name: "Malt",
    shortDescription: "Chilled malt drink",
    description: "A cold bottle of malt — the classic plate companion.",
  },
};

const itemsSv: Record<string, CatalogCopy> = {
  jollof: {
    name: "Jollofris",
    shortDescription: "Rökig ghanansk jollof",
    description:
      "Tomateris från en gryta med lök, ingefära och scotch bonnet. Serveras med valt protein och shito.",
  },
  waakye: {
    name: "Waakye",
    shortDescription: "Ris och bönor, Accra-stil",
    description: "Ris och bönor ångade med hirsblad, serveras med sallad, spaghetti och valt protein.",
  },
  "red-red": {
    name: "Red Red",
    shortDescription: "Bönstuvning och plantain",
    description: "Svarta ögonbönor i palmolja, avslutade med knaprig stekt mogen plantain.",
  },
  "banku-tilapia": {
    name: "Banku och tilapia",
    shortDescription: "Grillad tilapia med banku",
    description: "Jäst banku med grillad tilapia, lök och pepparsås. Begränsat antal varje dag.",
  },
  "banku-okro": {
    name: "Banku och okrosoppa",
    shortDescription: "Banku med okra",
    description: "Mjuk banku med blank okrosoppa. Välj kyckling eller fisk.",
  },
  "fufu-light": {
    name: "Fufu och ljus soppa",
    shortDescription: "Fufu med ljus soppa",
    description: "Stött fufu med en klar, aromatisk ljus soppa. En söndagsklassiker, varje dag.",
  },
  "fufu-groundnut": {
    name: "Fufu och jordnötssoppa",
    shortDescription: "Fufu med jordnötssoppa",
    description: "Fufu i en djup, rostad jordnötssoppa. Observera jordnötter.",
  },
  "kenkey-fish": {
    name: "Kenkey och fisk",
    shortDescription: "Ga kenkey med stekt fisk",
    description: "Jäst kenkey med stekt fisk och färsk peppar. En kusttallrik.",
  },
  "fried-plantain": {
    name: "Stekt plantain",
    shortDescription: "Mogen plantain, stekt på beställning",
    description: "Söt mogen plantain, stekt tills kanterna karamelliseras.",
  },
  sobolo: {
    name: "Sobolo",
    shortDescription: "Hibiskusdryck",
    description: "Kall hibiskusdryck med ingefära och citrus.",
  },
  malt: {
    name: "Malt",
    shortDescription: "Kylt maltdryck",
    description: "En kall flaska malt — den klassiska följeslagaren till tallriken.",
  },
};

const groupsEn: Record<string, string> = {
  protein: "Protein",
  heat: "Spice level",
  extras: "Extras",
  drinks: "Drinks",
};

const groupsSv: Record<string, string> = {
  protein: "Protein",
  heat: "Styrka",
  extras: "Tillägg",
  drinks: "Dryck",
};

const optionsEn: Record<string, string> = {
  chicken: "Chicken",
  beef: "Beef",
  fish: "Fish",
  "mild-shito": "Mild shito",
  "hot-shito": "Hot shito",
  "extra-chicken": "Extra chicken",
  "extra-beef": "Extra beef",
  "extra-fish": "Extra fish",
  plantain: "Plantain",
  salad: "Salad",
  "drink-sobolo": "Sobolo",
  "drink-malt": "Malt",
};

const optionsSv: Record<string, string> = {
  chicken: "Kyckling",
  beef: "Nötkött",
  fish: "Fisk",
  "mild-shito": "Mild shito",
  "hot-shito": "Stark shito",
  "extra-chicken": "Extra kyckling",
  "extra-beef": "Extra nötkött",
  "extra-fish": "Extra fisk",
  plantain: "Plantain",
  salad: "Sallad",
  "drink-sobolo": "Sobolo",
  "drink-malt": "Malt",
};

const categoryKeys: Record<string, { name: MessageKey; description?: MessageKey }> = {
  plates: { name: "category.plates", description: "category.platesDescription" },
  sides: { name: "category.sides" },
  drinks: { name: "category.drinks" },
};

function itemsFor(locale: Locale): Record<string, CatalogCopy> {
  return locale === "sv" ? itemsSv : itemsEn;
}

function groupsFor(locale: Locale): Record<string, string> {
  return locale === "sv" ? groupsSv : groupsEn;
}

function optionsFor(locale: Locale): Record<string, string> {
  return locale === "sv" ? optionsSv : optionsEn;
}

export function localizeMenuName(id: string, fallback: string, locale: Locale): string {
  return itemsFor(locale)[id]?.name ?? fallback;
}

export function localizeMenuDescription(
  id: string,
  fallback: string,
  locale: Locale,
  field: "shortDescription" | "description" = "shortDescription",
): string {
  return itemsFor(locale)[id]?.[field] ?? fallback;
}

export function localizeOptionName(id: string, fallback: string, locale: Locale): string {
  return optionsFor(locale)[id] ?? fallback;
}

export function localizeGroupName(id: string, fallback: string, locale: Locale): string {
  return groupsFor(locale)[id] ?? fallback;
}

export function localizeCategoryName(id: string, fallback: string, t: Translator): string {
  const keys = categoryKeys[id];
  return keys ? t(keys.name) : fallback;
}

export function localizeCategoryDescription(
  id: string,
  fallback: string | undefined,
  t: Translator,
): string | undefined {
  const keys = categoryKeys[id];
  return keys?.description ? t(keys.description) : fallback;
}

export function localizePublicItem(item: PublicMenuItem, locale: Locale, t: Translator): PublicMenuItem {
  const copy = itemsFor(locale)[item.id];
  const category = categoryKeys[item.categoryId];
  return {
    ...item,
    name: copy?.name ?? item.name,
    shortDescription: copy?.shortDescription ?? item.shortDescription,
    description: copy?.description ?? item.description,
    categoryName: category ? t(category.name) : item.categoryName,
    imageAlt: copy?.name ?? item.imageAlt,
    modifierGroups: item.modifierGroups.map((group) => ({
      ...group,
      name: localizeGroupName(group.id, group.name, locale),
      options: group.options.map((option) => ({
        ...option,
        name: localizeOptionName(option.id, option.name, locale),
      })),
    })),
  };
}

export function localizeCatalog(catalog: PublicCatalog, locale: Locale, t: Translator): PublicCatalog {
  return {
    ...catalog,
    categories: catalog.categories.map((category) => {
      const keys = categoryKeys[category.id];
      return {
        ...category,
        name: keys ? t(keys.name) : category.name,
        description: keys?.description ? t(keys.description) : category.description,
      };
    }),
    items: catalog.items.map((item) => localizePublicItem(item, locale, t)),
  };
}

const reviewKeys: Record<string, MessageKey> = {
  r1: "home.reviews.r1",
  r2: "home.reviews.r2",
  r3: "home.reviews.r3",
};

export function localizeReviewQuote(id: string, fallback: string, t: Translator): string {
  const key = reviewKeys[id];
  return key ? t(key) : fallback;
}

export function localizeHomepageCopy<
  T extends {
    hero: {
      eyebrow: string;
      title: string;
      subtitle: string;
      primaryCta: { label: string };
      secondaryCta: { label: string };
    };
    story: { eyebrow: string; title: string; body: string };
    delivery: { eyebrow: string; title: string; body: string };
    promotional: { eyebrow: string; title: string; body: string };
    reviews: Array<{ id: string; quote: string }>;
  },
>(homepage: T, t: Translator): T {
  return {
    ...homepage,
    hero: {
      ...homepage.hero,
      eyebrow: t("home.hero.eyebrow"),
      title: t("home.hero.title"),
      subtitle: t("home.hero.subtitle"),
      primaryCta: { ...homepage.hero.primaryCta, label: t("home.hero.primary") },
      secondaryCta: { ...homepage.hero.secondaryCta, label: t("home.hero.secondary") },
    },
    story: {
      ...homepage.story,
      eyebrow: t("home.story.eyebrow"),
      title: t("home.story.title"),
      body: t("home.story.body"),
    },
    delivery: {
      ...homepage.delivery,
      eyebrow: t("home.delivery.eyebrow"),
      title: t("home.delivery.title"),
      body: t("home.delivery.body"),
    },
    promotional: {
      ...homepage.promotional,
      eyebrow: t("home.promo.eyebrow"),
      title: t("home.promo.title"),
      body: t("home.promo.body"),
    },
    reviews: homepage.reviews.map((review) => ({
      ...review,
      quote: localizeReviewQuote(review.id, review.quote, t),
    })),
  };
}
