import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { CustomerShell } from "@/components/brand/customer-shell";
import { FoodPhoto } from "@/components/brand/food-photo";
import { MenuListItem } from "@/components/brand/menu-list-item";
import { Reveal, RevealGroup } from "@/components/brand/reveal";
import { SectionHeading } from "@/components/brand/section-heading";
import { FeaturedPlate } from "@/components/storefront/featured-plate";
import { HomeHero } from "@/components/storefront/home-hero";
import { HomeHours } from "@/components/storefront/home-hours";
import { PhotoBand } from "@/components/storefront/photo-band";
import { DeliveryCheck } from "@/components/storefront/delivery-check";
import { MarketingSignup } from "@/components/storefront/marketing-signup";
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
  const steps = [
    { title: t("home.steps.1.title"), body: t("home.steps.1.body") },
    { title: t("home.steps.2.title"), body: t("home.steps.2.body") },
    { title: t("home.steps.3.title"), body: t("home.steps.3.body") },
  ];

  return (
    <CustomerShell overlay>
      <TrackView name="menu_viewed" properties={{ surface: "home" }} />
      <main id="main">
        <HomeHero
          eyebrow={homepage.hero.eyebrow}
          title={homepage.hero.title}
          subtitle={homepage.hero.subtitle}
          primaryCta={homepage.hero.primaryCta}
          secondaryCta={homepage.hero.secondaryCta}
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
            <SectionHeading
              align="center"
              eyebrow={t("home.featured.eyebrow")}
              title={t("home.featured.title")}
              description={t("home.featured.description")}
            />
          </Reveal>
          <RevealGroup className="mx-auto mt-12 grid max-w-6xl gap-px bg-foreground/10 sm:grid-cols-2">
            {featuredFallback.map((item, index) => (
              <Reveal as="div" key={item.id} className={index === 0 ? "sm:col-span-2" : undefined}>
                <FeaturedPlate
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
              <SectionHeading
                eyebrow={t("home.today.eyebrow")}
                title={t("home.today.title")}
                description={t("home.today.description")}
              />
              <Button size="touch" variant="gold-outline" className="mt-8" asChild>
                <Link href="/menu">{t("home.today.cta")}</Link>
              </Button>
            </Reveal>
            <RevealGroup className="divide-y divide-foreground/10">
              {today.map((item) => (
                <Reveal as="div" key={item.id}>
                  <MenuListItem
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
          script={t("home.band.script")}
          title={t("home.band.title")}
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
              <SectionHeading
                eyebrow={homepage.story.eyebrow}
                title={homepage.story.title}
                description={homepage.story.body}
              />
              <aside className="mt-10 border-l border-gold/50 pl-6">
                <p className="text-[11px] uppercase tracking-[0.22em] text-earth">{t("home.story.asideEyebrow")}</p>
                <p className="mt-3 font-heading text-3xl text-balance">{t("home.story.asideTitle")}</p>
                <p className="mt-4 text-muted-foreground">{t("home.story.asideBody")}</p>
              </aside>
            </Reveal>
          </div>
        </section>

        <section id="categories" className="bg-card py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <SectionHeading align="center" eyebrow={t("home.categories.eyebrow")} title={t("home.categories.title")} />
            <ul className="mt-12 grid gap-px bg-foreground/10 sm:grid-cols-3">
              {catalog.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu#${category.slug}`}
                    className="group flex min-h-44 flex-col justify-end bg-background px-6 py-8 transition-colors hover:bg-ink hover:text-primary-foreground"
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gold">{t("nav.menu")}</p>
                    <h3 className="mt-3 font-heading text-3xl transition-transform duration-500 group-hover:-translate-y-1">
                      {category.name}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        <section id="how-it-works" className="scroll-mt-24 bg-background py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <SectionHeading align="center" eyebrow={t("home.steps.eyebrow")} title={t("home.steps.title")} />
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="text-center">
                  <p className="font-script text-4xl text-gold">0{index + 1}</p>
                  <h3 className="mt-3 font-heading text-2xl sm:text-3xl">{step.title}</h3>
                  <p className="mt-3 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section id="delivery" className="scroll-mt-24 bg-card py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <Reveal>
              <SectionHeading
                eyebrow={homepage.delivery.eyebrow}
                title={homepage.delivery.title}
                description={homepage.delivery.body}
              />
            </Reveal>
            <Reveal delay={0.08}>
              <DeliveryCheck />
            </Reveal>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <SectionHeading align="center" eyebrow={t("home.reviews.eyebrow")} title={t("home.reviews.title")} />
            <ul className="mt-14 grid gap-10 md:grid-cols-3">
              {homepage.reviews.map((review) => (
                <li key={review.id} className="text-center">
                  <p className="font-script text-5xl leading-none text-gold">&ldquo;</p>
                  <blockquote className="mt-2 text-lg leading-relaxed">&ldquo;{review.quote}&rdquo;</blockquote>
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
              <p className="font-script text-5xl text-gold">{t("home.visit.script")}</p>
              <h2 className="mt-2 font-heading text-5xl text-balance sm:text-6xl">{t("home.visit.title")}</h2>
              <AdinkraRule className="mt-5 text-gold" />
              <p className="mt-6 max-w-md text-primary-foreground/75">
                {t("home.visit.body", { address: restaurantDisplay.address })}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="touch" variant="gold" asChild>
                  <Link href="/menu">{t("home.visit.primary")}</Link>
                </Button>
                <Button size="touch" variant="gold-outline" asChild>
                  <Link href="#todays-menu">{t("home.visit.secondary")}</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.08} className="bg-card p-6 text-foreground sm:p-8">
              <p className="font-script text-4xl text-gold">{homepage.promotional.eyebrow}</p>
              <h3 className="mt-2 font-heading text-3xl">{homepage.promotional.title}</h3>
              <p className="mt-3 text-muted-foreground">{homepage.promotional.body}</p>
              <div className="mt-6">
                <MarketingSignup />
              </div>
            </Reveal>
          </div>
        </section>
      </main>
    </CustomerShell>
  );
}
