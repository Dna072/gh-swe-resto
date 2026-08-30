"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagAccent } from "@/components/brand/flag-accent";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useT } from "@/components/i18n/locale-provider";
import { useCart } from "@/components/cart/cart-provider";
import { restaurantDisplay } from "@/lib/restaurant/display";
import { cn } from "@/lib/utils";

export function SiteHeader({
  cartCount,
  overlay = false,
  className,
}: {
  cartCount?: number;
  overlay?: boolean;
  className?: string;
}) {
  const t = useT();
  const cart = useCart();
  const count = cartCount ?? cart.itemCount;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/menu", label: t("nav.menu") },
    { href: "/#story", label: t("nav.story") },
    { href: "/#delivery", label: t("nav.delivery") },
    { href: "/contact", label: t("nav.contact") },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overlay && !scrolled;

  return (
    <header
      className={cn(
        overlay ? "fixed" : "sticky",
        "inset-x-0 top-0 z-40 text-primary-foreground transition-all duration-500",
        transparent
          ? "bg-transparent"
          : "bg-ink/94 shadow-[0_12px_40px_-20px_rgba(0,0,0,0.65)] backdrop-blur-md",
        className,
      )}
    >
      <div
        className={cn(
          "hidden overflow-hidden border-b text-[11px] uppercase tracking-[0.22em] transition-all duration-500 md:block",
          transparent
            ? "max-h-10 border-primary-foreground/15 text-primary-foreground/70"
            : "max-h-0 border-transparent opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <p>{restaurantDisplay.address}</p>
          <p>{restaurantDisplay.city}</p>
        </div>
      </div>
      <FlagAccent className={cn("rounded-none", transparent && "opacity-50")} />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-[4.5rem]">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-script text-[2rem] text-gold">Ghana</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.38em]">{t("brand.restaurant")}</span>
        </Link>
        <nav aria-label={t("a11y.primaryNav")} className="hidden items-center gap-8 text-[12px] uppercase tracking-[0.22em] md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform hover:text-gold hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden md:inline-flex" />
          <Button variant="gold-outline" size="sm" className="hidden h-10 px-4 md:inline-flex" asChild>
            <Link href="/menu">{t("nav.orderNow")}</Link>
          </Button>
          <Button
            variant="outline"
            size="icon-touch"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
            aria-label={open ? t("a11y.closeMenu") : t("a11y.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X /> : <Menu />}
          </Button>
          <Button
            variant="outline"
            size="icon-touch"
            className="relative border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link href="/cart" aria-label={t("a11y.cart", { count })}>
              <ShoppingBag />
              {count > 0 ? (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gold text-[10px] text-gold-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-primary-foreground/10 bg-ink md:hidden">
          <nav className="grid gap-1 px-4 py-6 text-sm uppercase tracking-[0.2em]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-12 py-3"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/account" className="min-h-12 py-3" onClick={() => setOpen(false)}>
              {t("nav.account")}
            </Link>
            <LanguageSwitcher className="mt-2 justify-start" />
            <Button variant="gold" size="touch" className="mt-3" asChild>
              <Link href="/menu" onClick={() => setOpen(false)}>
                {t("nav.orderNow")}
              </Link>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
