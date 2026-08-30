import Link from "next/link";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { restaurantDisplay } from "@/lib/restaurant/display";

const menuLinks = [
  { href: "/menu", label: "Today's menu" },
  { href: "/#story", label: "Our story" },
  { href: "/#delivery", label: "Delivery" },
  { href: "/contact", label: "Contact" },
];

const resourceLinks = [
  { href: "/legal/allergens", label: "Allergens" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/orders", label: "Find an order" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-[1.3fr_0.8fr_0.9fr]">
        <div>
          <p className="font-script text-4xl text-gold">Ghana</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.34em]">Restaurant · Uppsala</p>
          <AdinkraRule className="mt-5 text-gold" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            Ghanaian plates cooked in Uppsala. Delivery zones and prices are confirmed on the
            server — never guessed in the browser.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Menu</p>
          <nav aria-label="Footer menu" className="mt-4 grid gap-2 text-sm">
            {menuLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-primary-foreground/75 hover:text-gold">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Visit</p>
          <p className="mt-4 text-sm text-primary-foreground/75">
            {restaurantDisplay.addressLine}
            <br />
            {restaurantDisplay.postalLine}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            {restaurantDisplay.hours.map((slot) => (
              <li key={slot.label}>
                <span className="text-gold">{slot.label}</span>
                <br />
                {slot.days} · {slot.time}
              </li>
            ))}
          </ul>
          <nav aria-label="Legal" className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-[0.16em] text-primary-foreground/55">
            {resourceLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-gold">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-primary-foreground/45">
          Demo catalog. Pickup address and legal entity will be confirmed before launch.
        </p>
      </div>
    </footer>
  );
}
