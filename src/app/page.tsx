import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { CustomerShell } from "@/components/brand/customer-shell";
import { MealCard } from "@/components/brand/meal-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { HomeHero } from "@/components/storefront/home-hero";
import { DeliveryCheck } from "@/components/storefront/delivery-check";
import { MarketingSignup } from "@/components/storefront/marketing-signup";
import { TrackView } from "@/components/storefront/track-view";
import { imageUrl, objectPosition } from "@/lib/media/display";
import { lowStockLabel, soldOut } from "@/lib/menu/display";
import { loadHomepage, loadPublicCatalog } from "@/server/catalog";

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

        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:gap-20 sm:py-16">
          <section id="featured" className="scroll-mt-20 space-y-8">
            <SectionHeading
              eyebrow="Signature plates"
              title="What we want you to taste first"
              description="Real kitchen photographs replace these placeholders as soon as the restaurant uploads them."
            />
            <div className="grid gap-4 md:grid-cols-2">
              {featuredFallback.map((item, index) => (
                <MealCard
                  key={item.id}
                  name={item.name}
                  description={item.shortDescription}
                  priceOre={item.displayPriceOre}
                  imageAlt={item.imageAlt}
                  imageUrl={item.imageUrl}
                  imagePosition={item.imagePosition}
                  href={`/menu/${item.slug}`}
                  featured={item.popular}
                  soldOut={soldOut(item)}
                  lowStockLabel={lowStockLabel(item)}
                  addLabel="Order"
                  editorial={index === 0}
                  className={index === 0 ? "md:col-span-2" : undefined}
                  dietaryLabels={item.dietaryTags.map((tag) => tag.replaceAll("_", " ").toLowerCase())}
                />
              ))}
            </div>
          </section>

          <section id="todays-menu" className="scroll-mt-20 space-y-8">
            <SectionHeading
              eyebrow="Today’s kitchen"
              title="What can I order today?"
              description="Prices include today’s weekday or weekend rate. The server is the source of truth."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {today.map((item) => (
                <MealCard
                  key={item.id}
                  name={item.name}
                  description={item.shortDescription}
                  priceOre={item.displayPriceOre}
                  imageAlt={item.imageAlt}
                  imageUrl={item.imageUrl}
                  imagePosition={item.imagePosition}
                  href={`/menu/${item.slug}`}
                  soldOut={soldOut(item)}
                  lowStockLabel={lowStockLabel(item)}
                  addLabel="Customize"
                  dietaryLabels={item.dietaryTags.map((tag) => tag.replaceAll("_", " ").toLowerCase())}
                />
              ))}
            </div>
            <Button size="touch" variant="outline" asChild>
              <Link href="/menu">See sides and drinks</Link>
            </Button>
          </section>

          <section id="story" className="scroll-mt-20 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <SectionHeading
              eyebrow={homepage.story.eyebrow}
              title={homepage.story.title}
              description={homepage.story.body}
            />
            <aside className="relative overflow-hidden rounded-2xl bg-ink px-6 py-8 text-primary-foreground bg-kente">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Ghana in Uppsala</p>
              <h3 className="mt-3 font-heading text-3xl text-balance">Home food, cooked here</h3>
              <AdinkraRule className="mt-4 text-gold" />
              <p className="mt-4 text-primary-foreground/80">
                Jollof that tastes of the pot, banku with proper pepper, waakye on a Saturday. The brand is
                Ghanaian; the kitchen is in Uppsala.
              </p>
              <p className="mt-6 text-xs uppercase tracking-[0.18em] text-gold/80">Photograph coming soon</p>
            </aside>
          </section>

          <section id="categories" className="space-y-8">
            <SectionHeading eyebrow="Menu" title="Browse by plate" />
            <ul className="grid gap-3 sm:grid-cols-3">
              {catalog.categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/menu#${category.slug}`}
                    className="flex min-h-24 flex-col justify-between rounded-2xl bg-card p-5 ring-1 ring-foreground/10 transition-colors hover:bg-secondary"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-earth">Category</p>
                    <h3 className="font-heading text-2xl">{category.name}</h3>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section id="how-it-works" className="scroll-mt-20 space-y-8">
            <SectionHeading eyebrow="How it works" title="From postcode to plate" />
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                  <p className="font-mono text-sm text-earth">0{index + 1}</p>
                  <h3 className="mt-2 font-heading text-2xl">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="delivery" className="scroll-mt-20 grid gap-8 md:grid-cols-[1fr_20rem] md:items-start">
            <SectionHeading
              eyebrow={homepage.delivery.eyebrow}
              title={homepage.delivery.title}
              description={homepage.delivery.body}
            />
            <DeliveryCheck />
          </section>

          <section className="space-y-8">
            <SectionHeading eyebrow="From guests" title="What people say" />
            <ul className="grid gap-4 md:grid-cols-3">
              {homepage.reviews.map((review) => (
                <li key={review.id} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                  <p className="font-mono text-sm text-gold">{"★".repeat(review.rating)}</p>
                  <blockquote className="mt-3 text-lg">&ldquo;{review.quote}&rdquo;</blockquote>
                  <p className="mt-3 text-sm text-muted-foreground">{review.name}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-8 rounded-3xl bg-ink px-6 py-10 text-primary-foreground md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-10">
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Order</p>
              <h2 className="font-heading text-4xl text-balance">Hungry now? Start with today&apos;s menu.</h2>
              <AdinkraRule className="text-gold" />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="touch" variant="gold" asChild>
                  <Link href="/menu">Order today</Link>
                </Button>
                <Button
                  size="touch"
                  variant="outline"
                  className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link href="#todays-menu">See today&apos;s plates</Link>
                </Button>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl bg-card p-5 text-foreground">
              <h3 className="font-heading text-2xl">{homepage.promotional.title}</h3>
              <p className="text-muted-foreground">{homepage.promotional.body}</p>
              <MarketingSignup />
            </div>
          </section>
        </div>
      </main>
    </CustomerShell>
  );
}
