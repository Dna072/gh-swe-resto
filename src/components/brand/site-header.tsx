import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagAccent } from "@/components/brand/flag-accent";
import { cn } from "@/lib/utils";

export function SiteHeader({
  cartCount = 0,
  className,
}: {
  cartCount?: number;
  className?: string;
}) {
  return (
    <header className={cn("sticky top-0 z-40 bg-background/90 backdrop-blur-md", className)}>
      <FlagAccent />
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-heading text-lg tracking-tight">
          Ghana Restaurant
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 text-sm md:flex">
          <Link href="/menu" className="hover:text-earth">
            Menu
          </Link>
          <Link href="/design-system" className="hover:text-earth">
            Design system
          </Link>
        </nav>
        <Button variant="outline" size="icon-touch" className="relative" asChild>
          <Link href="/cart" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingBag />
            {cartCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-earth text-[10px] text-earth-foreground">
                {cartCount}
              </span>
            ) : null}
          </Link>
        </Button>
      </div>
    </header>
  );
}
