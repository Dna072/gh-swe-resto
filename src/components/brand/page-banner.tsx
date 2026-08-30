import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { cn } from "@/lib/utils";

export function PageBanner({
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
    <section
      className={cn(
        "relative overflow-hidden bg-ink px-4 py-16 text-center text-primary-foreground sm:py-20",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-kente opacity-40" />
      <div className="relative mx-auto max-w-3xl space-y-4">
        {eyebrow ? <p className="font-script text-4xl text-gold sm:text-5xl">{eyebrow}</p> : null}
        <h1 className="font-heading text-4xl text-balance sm:text-6xl">{title}</h1>
        <AdinkraRule className="mx-auto text-gold" />
        {description ? (
          <p className="mx-auto max-w-xl text-base text-primary-foreground/75 sm:text-lg">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
