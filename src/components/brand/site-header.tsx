"use client";

import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagAccent } from "@/components/brand/flag-accent";
import { useCart } from "@/components/cart/cart-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/menu", label: "Today's menu" },
  { href: "/#story", label: "About" },
  { href: "/#delivery", label: "Delivery" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({
  cartCount,
  overlay = false,
  className,
}: {
  cartCount?: number;
  overlay?: boolean;
  className?: string;
}) {
  const cart = useCart();
  const count = cartCount ?? cart.itemCount;

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        overlay
          ? "border-b border-primary-foreground/10 bg-ink/80 text-primary-foreground backdrop-blur-md"
          : "bg-background/90 backdrop-blur-md",
        className,
      )}
    >
      <FlagAccent />
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-heading text-lg tracking-tight">
          Ghana Restaurant
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gold">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon-touch"
                className={cn("md:hidden", overlay && "border-primary-foreground/30 bg-transparent")}
                aria-label="Open menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-background text-foreground">
              <SheetHeader>
                <SheetTitle className="font-heading">Menu</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-3 px-4 text-base">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="min-h-11 py-2">
                    {link.label}
                  </Link>
                ))}
                <Link href="/account" className="min-h-11 py-2">
                  Account
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Button
            variant="outline"
            size="icon-touch"
            className={cn("relative", overlay && "border-primary-foreground/30 bg-transparent")}
            asChild
          >
            <Link href="/cart" aria-label={`Cart, ${count} items`}>
              <ShoppingBag />
              {count > 0 ? (
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-earth text-[10px] text-earth-foreground">
                  {count}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
