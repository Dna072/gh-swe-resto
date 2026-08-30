import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { CustomerShell } from "@/components/brand/customer-shell";
import { PageBanner } from "@/components/brand/page-banner";
import { Reveal } from "@/components/brand/reveal";
import { restaurantDisplay } from "@/lib/restaurant/display";
import { seedRestaurant } from "@/infrastructure/seed/ghana-menu";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <CustomerShell>
      <main id="main">
        <PageBanner
          eyebrow="Visit us"
          title="Contact"
          description={`${seedRestaurant.name} is preparing service in ${seedRestaurant.city}.`}
        />
        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-16 sm:py-24 lg:grid-cols-2">
          <Reveal>
            <p className="font-script text-5xl text-gold">Location</p>
            <h2 className="mt-3 font-heading text-4xl">Uppsala</h2>
            <AdinkraRule className="mt-5" />
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              The demo pickup address is {restaurantDisplay.address}. Confirm the real kitchen
              address before launch.
            </p>
            <p className="mt-4 text-muted-foreground">
              Email and phone will be published with the legal entity. Kitchen questions: use the
              allergen page first.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="touch" variant="gold" asChild>
                <Link href="/menu">Order today</Link>
              </Button>
              <Button size="touch" variant="gold-outline" asChild>
                <Link href="/legal/allergens">Allergen guide</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="bg-card px-6 py-10 text-center sm:px-10">
            <p className="font-script text-5xl text-gold">Hours</p>
            <AdinkraRule className="mx-auto mt-5" />
            <ul className="mt-8 space-y-8">
              {restaurantDisplay.hours.map((slot) => (
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
