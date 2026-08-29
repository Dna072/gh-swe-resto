import Link from "next/link";
import { AdinkraRule } from "@/components/brand/adinkra-rule";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/legal/allergens", label: "Allergens" },
  { href: "/legal/terms", label: "Terms" },
  { href: "/legal/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <div>
          <p className="font-heading text-2xl">Ghana Restaurant</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Ghanaian plates cooked in Uppsala. Delivery zones and prices are confirmed on the
            server — never guessed in the browser.
          </p>
          <AdinkraRule className="mt-4" />
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-earth">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">
          Demo catalog. Pickup address and legal entity will be confirmed before launch.
        </p>
      </div>
    </footer>
  );
}
