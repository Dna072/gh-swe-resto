import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { CustomerShell } from "@/components/brand/customer-shell";
import { FoodPhoto } from "@/components/brand/food-photo";
import { MenuListItem } from "@/components/brand/menu-list-item";
import { Reveal, RevealGroup } from "@/components/brand/reveal";
import { LocalizedCopy } from "@/components/i18n/localized-copy";
import { LocalizedSectionHeading } from "@/components/brand/localized-section-heading";
import { LocalizedCategoryName } from "@/components/storefront/localized-category";
import { LocalizedReviewQuote } from "@/components/storefront/localized-review-quote";
import { HomePromo } from "@/components/storefront/home-promo";
import { HomeSteps } from "@/components/storefront/home-steps";
import { FeaturedPlate } from "@/components/storefront/featured-plate";
import { HomeHero } from "@/components/storefront/home-hero";
import { HomeHours } from "@/components/storefront/home-hours";
import { PhotoBand } from "@/components/storefront/photo-band";
import { DeliveryCheck } from "@/components/storefront/delivery-check";
import { TrackView } from "@/components/storefront/track-view";
import { localizeCatalog, localizeHomepageCopy } from "@/lib/i18n/catalog";
import { getLocale, getTranslator } from "@/lib/i18n/server";
import { imageUrl, objectPosition } from "@/lib/media/display";
import { restaurantDisplay } from "@/lib/restaurant/display";
import { soldOut } from "@/lib/menu/display";
import { loadHomepage, loadPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  const homepage = localizeHomepageCopy(await loadHomepage(), t);
  const heroSrc = imageUrl(homepage.hero.image, "hero");
  return {
    title: t("meta.siteTitle"),
    description: homepage.hero.subtitle,
    openGraph: {
      title: t("meta.siteTitle"),
      description: homepage.hero.subtitle,
      ...(heroSrc
        ? { images: [{ url: heroSrc, alt: homepage.hero.image?.altText ?? homepage.hero.image?.alt ?? homepage.hero.title }] }
        : {}),
    },
  };
}

export default async function HomePage() {
  const t = await getTranslator();
  const locale = await getLocale();
  const [rawCatalog, rawHomepage] = await Promise.all([loadPublicCatalog(), loadHomepage()]);
  const catalog = localizeCatalog(rawCatalog, locale, t);
  const homepage = localizeHomepageCopy(rawHomepage, t);
  const byId = new Map(catalog.items.map((item) => [item.id, item]));
  const featured = homepage.featuredMealIds
    .map((id) => byId.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const featuredFallback =
    featured.length > 0 ? featured : catalog.items.filter((item) => item.featured || item.popular).slice(0, 4);
  const today = catalog.items.filter((item) => item.categoryId === "plates");
  const storyImage = featuredFallback[0];
  const bandImage = featuredFallback[1] ?? storyImage;
  return (
    <CustomerShell overlay>
      <TrackView name="menu_viewed" properties={{ surface: "home" }} />
      <main id="main">
        <HomeHero
          primaryHref={homepage.hero.primaryCta.href}
          secondaryHref={homepage.hero.secondaryCta.href}
          imageSrc={imageUrl(homepage.hero.image, "hero")}
          imageAlt={homepage.hero.image?.altText ?? homepage.hero.image?.alt ?? homepage.hero.title}
          imagePosition={objectPosition(homepage.hero.image)}
          mobileImageSrc={imageUrl(homepage.hero.mobileImage, "hero")}
          mobileImageAlt={homepage.hero.mobileImage?.altText ?? homepage.hero.mobileImage?.alt}
          mobileImagePosition={objectPosition(homepage.hero.mobileImage)}
        />

        <HomeHours />

        <section id="featured" className="scroll-mt-24 bg-background py-20 sm:py-28">
          <Reveal className="mx-auto max-w-4xl px-4">
            <LocalizedSectionHeading
              align="center"
              eyebrowKey="home.featured.eyebrow"
              titleKey="home.featured.title"
              descriptionKey="home.featured.description"
            />
          </Reveal>
          <RevealGroup className="mx-auto mt-12 grid max-w-6xl gap-px bg-foreground/10 sm:grid-cols-2">
            {featuredFallback.map((item, index) => (
              <Reveal as="div" key={item.id} className={index === 0 ? "sm:col-span-2" : undefined}>
                <FeaturedPlate
                  itemId={item.id}
                  name={item.name}
                  description={item.shortDescription}
                  priceOre={item.displayPriceOre}
                  href={`/menu/${item.slug}`}
                  imageUrl={item.imageUrl}
                  imageAlt={item.imageAlt}
                  imagePosition={item.imagePosition}
                  featured={item.popular}
                  className={index === 0 ? "md:min-h-[36rem]" : undefined}
                />
              </Reveal>
            ))}
          </RevealGroup>
        </section>

        <section id="todays-menu" className="scroll-mt-24 bg-card py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-14 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Reveal className="lg:sticky lg:top-28">
              <LocalizedSectionHeading
                eyebrowKey="home.today.eyebrow"
                titleKey="home.today.title"
                descriptionKey="home.today.description"
              />
              <Button size="touch" variant="gold-outline" className="mt-8" asChild>
                <Link href="/menu">
                  <LocalizedCopy messageKey="home.today.cta" />
                </Link>
              </Button>
            </Reveal>
            <RevealGroup className="divide-y divide-foreground/10">
              {today.map((item) => (
                <Reveal as="div" key={item.id}>
                  <MenuListItem
                    itemId={item.id}
                    name={item.name}
                    description={item.shortDescription}
                    priceOre={item.displayPriceOre}
                    href={`/menu/${item.slug}`}
                    soldOut={soldOut(item)}
                  />
                </Reveal>
              ))}
            </RevealGroup>
          </div>
        </section>

        <PhotoBand
          imageSrc={bandImage?.imageUrl ?? null}
          imageAlt={bandImage?.imageAlt ?? t("home.band.alt")}
          imagePosition={bandImage?.imagePosition}
        />

        <section id="story" className="scroll-mt-24 bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden bg-ink">
                <FoodPhoto
                  src={storyImage?.imageUrl}
                  alt={storyImage?.imageAlt ?? homepage.story.title}
                  name={homepage.story.title}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  objectPosition={storyImage?.imagePosition}
                  placeholderTone="ink"
                  className="size-full"
                />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <LocalizedSectionHeading
                eyebrowKey="home.story.eyebrow"
                titleKey="home.story.title"
                descriptionKey="home.story.body"
              />
              <aside className="mt-10 border-l border-gold/50 pl-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-earth">
                  <LocalizedCopy messageKey="home.story.asideEyebrow" />
                </p>
                <p className="mt-3 font-heading text-3xl text-balance">
                  <LocalizedCopy messageKey="home.story.asideTitle" />
                </p>
                <p className="mt-4 text-muted-foreground">
                  <LocalizedCopy messageKey="home.story.asideBody" />
                </p>
              </aside>
            </Reveal>
          </div>
        </section>

        <section id="categories" className="bg-card py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <LocalizedSectionHeading
              align="center"
              eyebrowKey="home.categories.eyebrow"
              titleKey="home.categories.title"
            />
            <ul className="mt-12 grid gap-px bg-foreground/10 sm:grid-cols-3">
              {catalog.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu#${category.slug}`}
                    className="group flex min-h-44 flex-col justify-end bg-background px-6 py-8 transition-colors hover:bg-ink hover:text-primary-foreground"
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
                      <LocalizedCopy messageKey="nav.menu" />
                    </p>
                    <h3 className="mt-3 font-heading text-3xl transition-transform duration-500 group-hover:-translate-y-1">
                      <LocalizedCategoryName id={category.id} fallback={category.name} />
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-background py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <LocalizedSectionHeading align="center" eyebrowKey="home.steps.eyebrow" titleKey="home.steps.title" />
            <HomeSteps />
          </Reveal>
        </section>

        <section id="delivery" className="scroll-mt-24 bg-card py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <Reveal>
              <LocalizedSectionHeading
                eyebrowKey="home.delivery.eyebrow"
                titleKey="home.delivery.title"
                descriptionKey="home.delivery.body"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <DeliveryCheck />
            </Reveal>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <LocalizedSectionHeading
              align="center"
              eyebrowKey="home.reviews.eyebrow"
              titleKey="home.reviews.title"
            />
            <ul className="mt-14 grid gap-10 md:grid-cols-3">
              {homepage.reviews.map((review) => (
                <li key={review.id} className="text-center">
                  <p className="font-script text-5xl leading-none text-gold">&ldquo;</p>
                  <blockquote className="mt-2 text-lg leading-relaxed">
                    &ldquo;
                    <LocalizedReviewQuote id={review.id} fallback={review.quote} />
                    &rdquo;
                  </blockquote>
                  <AdinkraRule className="mx-auto mt-5" />
                  <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-earth">{review.name}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section className="bg-ink px-4 py-20 text-primary-foreground sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
            <Reveal>
              <p className="font-script text-5xl text-gold">
                <LocalizedCopy messageKey="home.visit.script" />
              </p>
              <h2 className="mt-2 font-heading text-5xl text-balance sm:text-6xl">
                <LocalizedCopy messageKey="home.visit.title" />
              </h2>
              <AdinkraRule className="mt-5 text-gold" />
              <p className="mt-6 max-w-md text-primary-foreground/75">
                <LocalizedCopy messageKey="home.visit.body" vars={{ address: restaurantDisplay.address }} />
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="touch" variant="gold" asChild>
                  <Link href="/menu">
                    <LocalizedCopy messageKey="home.visit.primary" />
                  </Link>
                </Button>
                <Button size="touch" variant="gold-outline" asChild>
                  <Link href="#todays-menu">
                    <LocalizedCopy messageKey="home.visit.secondary" />
                  </Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.08} className="bg-card p-6 text-foreground sm:p-8">
              <HomePromo />
            </Reveal>
          </div>
        </section>
      </main>
    </CustomerShell>
  );
}
