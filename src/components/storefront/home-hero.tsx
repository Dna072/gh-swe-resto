"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { FoodPhoto } from "@/components/brand/food-photo";
import { useT } from "@/components/i18n/locale-provider";
import { fadeVariants, heroStagger, revealVariants } from "@/lib/motion";

export function HomeHero({
  primaryHref,
  secondaryHref,
  imageSrc,
  imageAlt,
  imagePosition,
  mobileImageSrc,
  mobileImageAlt,
  mobileImagePosition,
}: {
  primaryHref: string;
  secondaryHref: string;
  imageSrc: string | null;
  imageAlt: string;
  imagePosition?: string;
  mobileImageSrc: string | null;
  mobileImageAlt?: string;
  mobileImagePosition?: string;
}) {
  const t = useT();
  const reduced = useReducedMotion() ?? false;
  const title = t("home.hero.title");

  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
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
                kenBurns={!reduced}
                placeholderTone="ink"
                className="size-full"
              />
            </div>
            <div className="absolute inset-0 hidden md:block">
              <HeroMedia
                src={imageSrc}
                alt={imageAlt}
                title={title}
                objectPosition={imagePosition}
                kenBurns={!reduced}
              />
            </div>
          </>
        ) : (
          <HeroMedia
            src={imageSrc}
            alt={imageAlt}
            title={title}
            objectPosition={imagePosition}
            kenBurns={!reduced}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
        <div className="absolute inset-0 bg-ink/15" />
      </div>
      <motion.div
        className="relative mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center gap-6 px-4 pb-24 pt-28 text-center text-primary-foreground"
        variants={reduced ? undefined : heroStagger}
        initial={reduced ? "visible" : "hidden"}
        animate="visible"
      >
        <motion.p
          variants={revealVariants(reduced)}
          className="font-script text-5xl text-gold sm:text-6xl"
        >
          {t("home.hero.eyebrow")}
        </motion.p>
        <motion.h1
          variants={revealVariants(reduced)}
          className="whitespace-pre-line font-heading text-5xl text-balance sm:text-7xl md:text-8xl"
        >
          {title}
        </motion.h1>
        <motion.div variants={fadeVariants(reduced)}>
          <AdinkraRule className="mx-auto text-gold" />
        </motion.div>
        <motion.p
          variants={revealVariants(reduced)}
          className="max-w-xl text-base text-primary-foreground/80 sm:text-lg"
        >
          {t("home.hero.subtitle")}
        </motion.p>
        <motion.div
          variants={revealVariants(reduced)}
          className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
        >
          <Button size="touch" variant="gold" asChild>
            <Link href={primaryHref}>{t("home.hero.primary")}</Link>
          </Button>
          <Button size="touch" variant="gold-outline" asChild>
            <Link href={secondaryHref}>{t("home.hero.secondary")}</Link>
          </Button>
        </motion.div>
      </motion.div>
      <a
        href="#hours"
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-primary-foreground/70"
      >
        <span>{t("home.hero.scroll")}</span>
        <span className="block h-10 w-px origin-top bg-gold motion-safe:animate-[scroll-cue_1.8s_ease-in-out_infinite]" />
      </a>
    </section>
  );
}

function HeroMedia({
  src,
  alt,
  title,
  objectPosition,
  kenBurns,
}: {
  src: string | null;
  alt: string;
  title: string;
  objectPosition?: string;
  kenBurns?: boolean;
}) {
  return (
    <FoodPhoto
      src={src}
      alt={alt}
      name={title}
      priority
      sizes="100vw"
      objectPosition={objectPosition}
      kenBurns={kenBurns}
      placeholderTone="ink"
      className="size-full"
    />
  );
}
