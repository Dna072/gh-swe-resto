"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, UtensilsCrossed, ShoppingBag, Receipt, UserRound } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/orders", label: "Orders", icon: Receipt },
  { href: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNav({ cartCount }: { cartCount?: number }) {
  const pathname = usePathname();
  const cart = useCart();
  const count = cartCount ?? cart.itemCount;

  return (
    <nav
      aria-label="Customer"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 text-[11px]",
                  active ? "text-gold" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
                {item.href === "/cart" && count > 0 ? (
                  <span className="absolute top-1 right-4 flex size-4 items-center justify-center rounded-full bg-gold text-[9px] text-gold-foreground">
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
