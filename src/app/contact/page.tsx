import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { CustomerShell } from "@/components/brand/customer-shell";
import { LocalizedPageBanner } from "@/components/brand/localized-page-banner";
import { Reveal } from "@/components/brand/reveal";
import { LocalizedCopy } from "@/components/i18n/localized-copy";
import { getTranslator } from "@/lib/i18n/server";
import { restaurantDisplay } from "@/lib/restaurant/display";
import { seedRestaurant } from "@/infrastructure/seed/ghana-menu";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("contact.metaTitle") };
}

export default function ContactPage() {
  const hours = [
    { labelKey: "hours.kitchen" as const, time: restaurantDisplay.hours[0].time },
    { labelKey: "hours.delivery" as const, time: restaurantDisplay.hours[1].time },
  ];

  return (
    <CustomerShell>
      <main id="main">
        <LocalizedPageBanner
          eyebrowKey="contact.eyebrow"
          titleKey="contact.title"
          descriptionKey="contact.description"
          descriptionVars={{ name: seedRestaurant.name, city: seedRestaurant.city }}
        />
        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <Reveal>
            <p className="font-script text-5xl text-gold">
              <LocalizedCopy messageKey="contact.location" />
            </p>
            <h2 className="mt-3 font-heading text-4xl">Uppsala</h2>
            <AdinkraRule className="mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              <LocalizedCopy messageKey="contact.body1" vars={{ address: restaurantDisplay.address }} />
            </p>
            <p className="mt-4 text-muted-foreground">
              <LocalizedCopy messageKey="contact.body2" />
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="touch" variant="gold" asChild>
                <Link href="/menu">
                  <LocalizedCopy messageKey="home.hero.primary" />
                </Link>
              </Button>
              <Button size="touch" variant="gold-outline" asChild>
                <Link href="/legal/allergens">
                  <LocalizedCopy messageKey="contact.allergenCta" />
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="bg-card px-6 py-10 text-center sm:px-10">
            <p className="font-script text-5xl text-gold">
              <LocalizedCopy messageKey="hours.heading" />
            </p>
            <AdinkraRule className="mx-auto mt-5" />
            <ul className="mt-8 space-y-8">
              {hours.map((slot) => (
                <li key={slot.labelKey}>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-earth">
                    <LocalizedCopy messageKey={slot.labelKey} />
                  </p>
                  <p className="mt-2 font-heading text-2xl">
                    <LocalizedCopy messageKey="hours.days" />
                  </p>
                  <p className="mt-1 text-muted-foreground">{slot.time}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </main>
    </CustomerShell>
  );
}
