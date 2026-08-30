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
import { imageUrl, objectPosition } from "@/lib/media/display";
import { restaurantDisplay } from "@/lib/restaurant/display";
import { soldOut } from "@/lib/menu/display";
import { loadHomepage, loadPublicCatalog } from "@/server/catalog";

export const dynamic = "force-dynamic";

const STEPS = [
  {
    title: "Check your postcode",
    body: "We only promise delivery where the kitchen can actually reach.",
  },
  {
    title: "Build the plate",
    body: "Protein, shito heat, extras. The kitchen sees exactly what you chose.",
  },
  {
    title: "Guest checkout",
    body: "Address and delivery fee are confirmed on the server. Payment comes later.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await loadHomepage();
  const heroSrc = imageUrl(homepage.hero.image, "hero");
  return {
    title: "Ghana Restaurant Uppsala",
    description: homepage.hero.subtitle,
    openGraph: {
      title: "Ghana Restaurant Uppsala",
      description: homepage.hero.subtitle,
      ...(heroSrc
        ? { images: [{ url: heroSrc, alt: homepage.hero.image?.altText ?? homepage.hero.image?.alt ?? "Restaurant hero" }] }
        : {}),
    },
  };
}

export default async function HomePage() {
  const [catalog, homepage] = await Promise.all([loadPublicCatalog(), loadHomepage()]);
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
              eyebrow="Delightful"
              title="Signature plates"
              description="Real kitchen photographs replace these placeholders as soon as the restaurant uploads them."
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
                eyebrow="Checkout"
                title="Today’s kitchen"
                description="Prices include today’s weekday or weekend rate. The server is the source of truth."
              />
              <Button size="touch" variant="gold-outline" className="mt-8" asChild>
                <Link href="/menu">See sides and drinks</Link>
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
          imageAlt={bandImage?.imageAlt ?? "Restaurant atmosphere"}
          imagePosition={bandImage?.imagePosition}
          script="Amazing"
          title="Delicious"
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
                <p className="text-[11px] uppercase tracking-[0.22em] text-earth">Ghana in Uppsala</p>
                <p className="mt-3 font-heading text-3xl text-balance">Home food, cooked here</p>
                <p className="mt-4 text-muted-foreground">
                  Jollof that tastes of the pot, banku with proper pepper, waakye on a Saturday. The
                  brand is Ghanaian; the kitchen is in Uppsala.
                </p>
              </aside>
            </Reveal>
          </div>
        </section>

        <section id="categories" className="bg-card py-20 sm:py-24">
          <Reveal className="mx-auto max-w-6xl px-4">
            <SectionHeading align="center" eyebrow="Discover" title="Browse the menu" />
            <ul className="mt-12 grid gap-px bg-foreground/10 sm:grid-cols-3">
              {catalog.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu#${category.slug}`}
                    className="group flex min-h-44 flex-col justify-end bg-background px-6 py-8 transition-colors hover:bg-ink hover:text-primary-foreground"
                  >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-gold">Menu</p>
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
            <SectionHeading align="center" eyebrow="Simple" title="From postcode to plate" />
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
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
            <SectionHeading align="center" eyebrow="Guests" title="What people say" />
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
              <p className="font-script text-5xl text-gold">Visit our</p>
              <h2 className="mt-2 font-heading text-5xl text-balance sm:text-6xl">Restaurant</h2>
              <AdinkraRule className="mt-5 text-gold" />
              <p className="mt-6 max-w-md text-primary-foreground/75">
                {restaurantDisplay.address}. Hungry now? Start with today&apos;s menu.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="touch" variant="gold" asChild>
                  <Link href="/menu">Order today</Link>
                </Button>
                <Button size="touch" variant="gold-outline" asChild>
                  <Link href="#todays-menu">See today&apos;s plates</Link>
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
