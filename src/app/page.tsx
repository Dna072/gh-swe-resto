import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerShell } from "@/components/brand/customer-shell";
import { MealCard } from "@/components/brand/meal-card";
import { SectionHeading } from "@/components/brand/section-heading";
import { DeliveryCheck } from "@/components/storefront/delivery-check";
import { MarketingSignup } from "@/components/storefront/marketing-signup";
import { TrackView } from "@/components/storefront/track-view";
import { seedReviews } from "@/infrastructure/seed/ghana-menu";
import { lowStockLabel, soldOut } from "@/lib/menu/display";
import { loadPublicCatalog } from "@/server/catalog";

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
    title: "We cook, then it moves",
    body: "Checkout and Wolt/Foodora delivery come in the next phase.",
  },
];

export default async function HomePage() {
  const catalog = await loadPublicCatalog();
  const popular = catalog.items.filter((item) => item.popular).slice(0, 4);
  const today = catalog.items.filter((item) => item.categoryId === "plates").slice(0, 6);

  return (
    <CustomerShell>
      <TrackView name="menu_viewed" properties={{ surface: "home" }} />
      <main id="main">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/meals/hero-feast.webp"
              alt="Ghanaian plates ready for delivery"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-ink/70" />
          </div>
          <div className="relative mx-auto flex min-h-[28rem] max-w-5xl flex-col justify-end gap-6 px-4 py-16 text-primary-foreground">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">Uppsala</p>
            <h1 className="max-w-xl font-heading text-4xl text-balance sm:text-6xl">
              Real Ghanaian food. Delivered in Uppsala.
            </h1>
            <p className="max-w-lg text-lg text-primary-foreground/85">
              Jollof, waakye, banku, fufu. Weekday and weekend prices are calculated on the
              server, not guessed in the menu.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="touch" variant="gold" asChild>
                <Link href="#popular">Order today</Link>
              </Button>
              <Button
                size="touch"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/menu">View today&apos;s menu</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-16">
          <section id="popular" className="scroll-mt-20 space-y-8">
            <SectionHeading
              eyebrow="Popular tonight"
              title="The plates people reorder"
              description="Prices include today’s weekday or weekend rate."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {popular.map((item) => (
                <MealCard
                  key={item.id}
                  name={item.name}
                  description={item.shortDescription}
                  priceOre={item.displayPriceOre}
                  imageAlt={item.imageAlt}
                  imageUrl={item.imageUrl}
                  href={`/menu/${item.slug}`}
                  featured={item.featured}
                  soldOut={soldOut(item)}
                  lowStockLabel={lowStockLabel(item)}
                  addLabel="Customize"
                />
              ))}
            </div>
          </section>

          <section id="todays-menu" className="space-y-8">
            <SectionHeading eyebrow="Kitchen" title="Today's menu" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {today.map((item) => (
                <MealCard
                  key={item.id}
                  name={item.name}
                  description={item.shortDescription}
                  priceOre={item.displayPriceOre}
                  imageAlt={item.imageAlt}
                  imageUrl={item.imageUrl}
                  href={`/menu/${item.slug}`}
                  soldOut={soldOut(item)}
                  lowStockLabel={lowStockLabel(item)}
                  addLabel="Customize"
                />
              ))}
            </div>
            <Button size="touch" variant="outline" asChild>
              <Link href="/menu">See sides and drinks</Link>
            </Button>
          </section>

          <section id="how-it-works" className="scroll-mt-20 space-y-8">
            <SectionHeading eyebrow="Flow" title="How it works" />
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

          <section className="grid gap-8 md:grid-cols-2 md:items-center">
            <SectionHeading
              eyebrow="From the kitchen"
              title="Ghanaian cooking, cooked here"
              description="This is home food: tomato rice that tastes of the pot, banku with proper pepper, fufu that does not apologise. We are opening first on our own site in Uppsala — Wolt and Foodora come later as delivery rails, not as the brand."
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
              <Image
                src="/meals/meal-jollof.webp"
                alt="Smoky Ghanaian jollof"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </section>

          <section className="grid gap-8 md:grid-cols-[1fr_20rem] md:items-start">
            <SectionHeading
              eyebrow="Delivery"
              title="Do we reach your door?"
              description="Enter an Uppsala postcode. Zones live in restaurant data, not in this page."
            />
            <DeliveryCheck />
          </section>

          <section className="space-y-8">
            <SectionHeading eyebrow="From guests" title="What people say" />
            <ul className="grid gap-4 md:grid-cols-3">
              {seedReviews.map((review) => (
                <li key={review.id} className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
                  <p className="font-mono text-sm text-gold">{"★".repeat(review.rating)}</p>
                  <blockquote className="mt-3 text-lg">&ldquo;{review.quote}&rdquo;</blockquote>
                  <p className="mt-3 text-sm text-muted-foreground">{review.name}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="grid gap-8 rounded-3xl bg-card p-6 ring-1 ring-foreground/10 md:grid-cols-2 md:p-10">
            <SectionHeading
              eyebrow="List"
              title="Get the weekend menu"
              description="Occasional emails only. Consent is required."
            />
            <MarketingSignup />
          </section>
        </div>
      </main>
    </CustomerShell>
  );
}
