import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FoodPhoto } from "@/components/brand/food-photo";

export function HomeHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
  imagePosition,
  mobileImageSrc,
  mobileImageAlt,
  mobileImagePosition,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageSrc: string | null;
  imageAlt: string;
  imagePosition?: string;
  mobileImageSrc: string | null;
  mobileImageAlt?: string;
  mobileImagePosition?: string;
}) {
  return (
    <section className="relative isolate min-h-[85svh] overflow-hidden md:min-h-[100svh]">
      <div className="absolute inset-0">
        {mobileImageSrc ? (
          <>
            <div className="absolute inset-0 md:hidden">
              <FoodPhoto
                src={mobileImageSrc}
                alt={mobileImageAlt || imageAlt}
                name={title}
                priority
                sizes="100vw"
                objectPosition={mobileImagePosition}
                className="size-full motion-safe:animate-[hero-in_1.1s_ease-out]"
              />
            </div>
            <div className="absolute inset-0 hidden md:block">
              <HeroMedia src={imageSrc} alt={imageAlt} title={title} objectPosition={imagePosition} />
            </div>
          </>
        ) : (
          <HeroMedia src={imageSrc} alt={imageAlt} title={title} objectPosition={imagePosition} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
      </div>
      <div className="relative mx-auto flex min-h-[85svh] max-w-6xl flex-col justify-end gap-5 px-4 pb-12 pt-24 text-primary-foreground md:min-h-[100svh] md:pb-20">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
        <h1 className="max-w-xl whitespace-pre-line font-heading text-4xl text-balance sm:text-6xl md:text-7xl">
          {title}
        </h1>
        <p className="max-w-md text-base text-primary-foreground/85 sm:text-lg">{subtitle}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button size="touch" variant="gold" asChild>
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          <Button
            size="touch"
            variant="outline"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function HeroMedia({
  src,
  alt,
  title,
  objectPosition,
}: {
  src: string | null;
  alt: string;
  title: string;
  objectPosition?: string;
}) {
  if (src) {
    return (
      <FoodPhoto
        src={src}
        alt={alt}
        name={title}
        priority
        sizes="100vw"
        objectPosition={objectPosition}
        className="size-full motion-safe:animate-[hero-in_1.1s_ease-out]"
      />
    );
  }

  return (
    <div className="flex size-full items-end bg-ink bg-kente p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Photograph coming soon</p>
    </div>
  );
}
