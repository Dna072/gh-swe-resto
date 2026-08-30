import type { MenuItemImage } from "@/domains/menu/models";
import type { Timestamped } from "@/domains/shared/types";

export interface HomepageCta {
  label: string;
  href: string;
}

export interface HomepageHeroContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: HomepageCta;
  secondaryCta: HomepageCta;
  image?: MenuItemImage;
  mobileImage?: MenuItemImage;
}

export interface HomepageStoryContent {
  eyebrow: string;
  title: string;
  body: string;
}

export interface HomepageDeliveryContent {
  eyebrow: string;
  title: string;
  body: string;
}

export interface HomepageReview {
  id: string;
  rating: number;
  name: string;
  quote: string;
}

export interface HomepageContent extends Timestamped {
  restaurantId: string;
  hero: HomepageHeroContent;
  featuredMealIds: string[];
  story: HomepageStoryContent;
  delivery: HomepageDeliveryContent;
  promotional: HomepageStoryContent;
  reviews: HomepageReview[];
}
