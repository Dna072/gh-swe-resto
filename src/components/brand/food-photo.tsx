import Image from "next/image";
import { ComingSoonLabel } from "@/components/i18n/coming-soon-label";
import { cn } from "@/lib/utils";

export function PhotoComingSoon({
  name,
  className,
  tone = "parchment",
}: {
  name: string;
  className?: string;
  tone?: "parchment" | "ink";
}) {
  return (
    <div
      className={cn(
        "relative flex size-full flex-col justify-between bg-kente p-5",
        tone === "ink" ? "bg-ink text-primary-foreground" : "bg-secondary",
        className,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium uppercase tracking-[0.28em]",
          tone === "ink" ? "text-gold" : "text-earth",
        )}
      >
        <ComingSoonLabel />
      </p>
      <p className="font-heading text-2xl text-balance sm:text-3xl">{name}</p>
    </div>
  );
}

export function FoodPhoto({
  src,
  alt,
  name,
  priority = false,
  sizes,
  objectPosition,
  className,
  kenBurns = false,
  placeholderTone = "parchment",
}: {
  src?: string | null;
  alt: string;
  name: string;
  priority?: boolean;
  sizes: string;
  objectPosition?: string;
  className?: string;
  kenBurns?: boolean;
  placeholderTone?: "parchment" | "ink";
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes={sizes}
          className={cn(
            "object-cover",
            kenBurns && "motion-safe:animate-[ken-burns_22s_ease-out_forwards]",
          )}
          style={objectPosition ? { objectPosition } : undefined}
        />
      ) : (
        <PhotoComingSoon name={name} tone={placeholderTone} />
      )}
    </div>
  );
}
