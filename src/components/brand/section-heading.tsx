import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  tone?: "default" | "light";
}) {
  const centered = align === "center";

  return (
    <div className={cn("max-w-2xl space-y-4", centered && "mx-auto text-center", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "font-script text-4xl leading-none sm:text-5xl",
            tone === "light" ? "text-gold" : "text-gold",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-heading text-4xl text-balance sm:text-5xl md:text-6xl",
          tone === "light" && "text-primary-foreground",
        )}
      >
        {title}
      </h2>
      <AdinkraRule className={cn(centered && "mx-auto", tone === "light" && "text-gold")} />
      {description ? (
        <p
          className={cn(
            "text-base leading-relaxed sm:text-lg",
            tone === "light" ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
