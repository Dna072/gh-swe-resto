import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-xl space-y-3", className)}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-earth">{eyebrow}</p>
      ) : null}
      <h2 className="font-heading text-3xl text-balance sm:text-4xl">{title}</h2>
      <AdinkraRule />
      {description ? <p className="text-muted-foreground">{description}</p> : null}
    </div>
  );
}
