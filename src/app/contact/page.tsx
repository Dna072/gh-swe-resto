import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { Reveal } from "@/components/brand/reveal";
import { getTranslator } from "@/lib/i18n/server";
import { restaurantDisplay } from "@/lib/restaurant/display";
import { seedRestaurant } from "@/infrastructure/seed/ghana-menu";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator();
  return { title: t("contact.metaTitle") };
}

export default async function ContactPage() {
  const t = await getTranslator();
  const hours = [
    { label: t("hours.kitchen"), days: t("hours.days"), time: restaurantDisplay.hours[0].time },
    { label: t("hours.delivery"), days: t("hours.days"), time: restaurantDisplay.hours[1].time },
  ];

  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow={t("contact.eyebrow")}
          title={t("contact.title")}
          description={t("contact.description", { name: seedRestaurant.name, city: seedRestaurant.city })}
        />
        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <Reveal>
            <p className="font-script text-5xl text-gold">{t("contact.location")}</p>
            <h2 className="mt-3 font-heading text-4xl">Uppsala</h2>
            <AdinkraRule className="mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {t("contact.body1", { address: restaurantDisplay.address })}
            </p>
            <p className="mt-4 text-muted-foreground">{t("contact.body2")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="touch" variant="gold" asChild>
                <Link href="/menu">{t("home.hero.primary")}</Link>
              </Button>
              <Button size="touch" variant="gold-outline" asChild>
                <Link href="/legal/allergens">{t("contact.allergenCta")}</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="bg-card px-6 py-10 text-center sm:px-10">
            <p className="font-script text-5xl text-gold">{t("hours.heading")}</p>
            <AdinkraRule className="mx-auto mt-5" />
            <ul className="mt-8 space-y-8">
              {hours.map((slot) => (
                <li key={slot.label}>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-earth">{slot.label}</p>
                  <p className="mt-2 font-heading text-2xl">{slot.days}</p>
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
