import type { PublicCatalog, PublicMenuItem } from "@/lib/menu/public";
import type { Locale } from "./locales";
import type { MessageKey, Translator } from "./messages";

type CatalogCopy = {
  name: string;
  shortDescription: string;
  description: string;
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
    name: "Fufu och light soup",
    shortDescription: "Fufu med light soup",
    description: "Stött fufu med en klar, aromatisk light soup. En söndagsklassiker, varje dag.",
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

const groupsSv: Record<string, string> = {
  protein: "Protein",
  heat: "Styrka",
  extras: "Tillägg",
  drinks: "Dryck",
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

export function localizeMenuName(id: string, fallback: string, locale: Locale): string {
  if (locale !== "sv") {
    return fallback;
  }
  return itemsSv[id]?.name ?? fallback;
}

export function localizeOptionName(id: string, fallback: string, locale: Locale): string {
  if (locale !== "sv") {
    return fallback;
  }
  return optionsSv[id] ?? fallback;
}

export function localizePublicItem(item: PublicMenuItem, locale: Locale, t: Translator): PublicMenuItem {
  const copy = locale === "sv" ? itemsSv[item.id] : undefined;
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
      name: locale === "sv" ? (groupsSv[group.id] ?? group.name) : group.name,
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

export function localizeHomepageCopy<T extends { hero: { eyebrow: string; title: string; subtitle: string; primaryCta: { label: string }; secondaryCta: { label: string } }; story: { eyebrow: string; title: string; body: string }; delivery: { eyebrow: string; title: string; body: string }; promotional: { eyebrow: string; title: string; body: string }; reviews: Array<{ id: string; quote: string }> }>(
  homepage: T,
  t: Translator,
): T {
  const reviewKey: Record<string, MessageKey> = {
    r1: "home.reviews.r1",
    r2: "home.reviews.r2",
    r3: "home.reviews.r3",
  };
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
    reviews: homepage.reviews.map((review) => {
      const key = reviewKey[review.id];
      return {
        ...review,
        quote: key ? t(key) : review.quote,
      };
    }),
  };
}
