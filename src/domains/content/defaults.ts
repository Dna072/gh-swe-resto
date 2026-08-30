import type { HomepageContent } from "./models";

export function defaultHomepageContent(restaurantId: string): HomepageContent {
  return {
    restaurantId,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    featuredMealIds: ["jollof", "waakye", "banku-tilapia", "red-red"],
    hero: {
      eyebrow: "Welcome to",
      title: "Meridian Fusion\nin Uppsala",
      subtitle: "Ghanaian plates, and more to come — cooked here. Order online for delivery or pickup from today’s menu.",
      primaryCta: { label: "Order today", href: "#todays-menu" },
      secondaryCta: { label: "View the menu", href: "/menu" },
    },
    story: {
      eyebrow: "Discover",
      title: "Our story",
      body: "This is home food: tomato rice that tastes of the pot, banku with proper pepper, fufu that does not apologise. Ghanaian plates first, with more meals to come. We open on our own site in Uppsala.",
    },
    delivery: {
      eyebrow: "Delivery",
      title: "Do we reach your door?",
      body: "Enter an Uppsala postcode. Zones live in restaurant data, not in this page.",
    },
    promotional: {
      eyebrow: "The list",
      title: "Get the weekend menu",
      body: "Occasional emails only. Consent is required.",
    },
    reviews: [
      {
        id: "r1",
        rating: 5,
        name: "Efua A.",
        quote: "The jollof tasted like home — and it arrived hot in Luthagen.",
      },
      {
        id: "r2",
        rating: 5,
        name: "Jonas L.",
        quote: "Banku and tilapia on a Thursday. We ordered again the same week.",
      },
      {
        id: "r3",
        rating: 4,
        name: "Ama K.",
        quote: "Clear spice levels, no surprises. The hot shito is actually hot.",
      },
    ],
  };
}
