import Link from "next/link";
import { Price } from "@/components/brand/price";
import type { Ore } from "@/lib/money";
import { cn } from "@/lib/utils";

export function MenuListItem({
  name,
  description,
  priceOre,
  href,
  soldOut,
  className,
}: {
  name: string;
  description: string;
  priceOre: Ore;
  href?: string;
  soldOut?: boolean;
  className?: string;
}) {
  const title = (
    <h3 className="font-heading text-xl leading-tight sm:text-2xl">
      {href ? (
        <Link href={href} className="transition-colors hover:text-gold">
          {name}
        </Link>
      ) : (
        name
      )}
    </h3>
  );

  return (
    <article className={cn("group py-5", soldOut && "opacity-60", className)}>
      <div className="flex items-baseline gap-3">
        {title}
        <span className="mb-1.5 hidden min-w-8 flex-1 border-b border-dotted border-foreground/25 sm:block" />
        <Price ore={priceOre} className="shrink-0 text-gold" />
      </div>
      <p className="mt-2 max-w-xl text-sm italic leading-relaxed text-muted-foreground">{description}</p>
      {soldOut ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-earth">Sold out</p> : null}
    </article>
  );
}
