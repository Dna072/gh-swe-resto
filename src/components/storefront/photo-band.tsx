"use client";

import { useReducedMotion } from "motion/react";
import { AdinkraRule } from "@/components/brand/adinkra-rule";
import { FoodPhoto } from "@/components/brand/food-photo";
import { Reveal } from "@/components/brand/reveal";
import { cn } from "@/lib/utils";

export function PhotoBand({
  imageSrc,
  imageAlt,
  imagePosition,
  script,
  title,
}: {
  imageSrc: string | null;
  imageAlt: string;
  imagePosition?: string;
  script: string;
  title: string;
}) {
  const reduced = useReducedMotion() ?? false;

  return (
    <section className="relative isolate min-h-[56svh] overflow-hidden md:min-h-[70svh]">
      <FoodPhoto
        src={imageSrc}
        alt={imageAlt}
        name={title}
        sizes="100vw"
        objectPosition={imagePosition}
        kenBurns={!reduced}
        placeholderTone="ink"
        className={cn("absolute inset-0 size-full")}
      />
      <div className="absolute inset-0 bg-ink/45" />
      <Reveal className="relative flex min-h-[56svh] flex-col items-center justify-center px-4 py-20 text-center text-primary-foreground md:min-h-[70svh]">
        <p className="font-script text-5xl text-gold sm:text-7xl">{script}</p>
        <h2 className="mt-3 font-heading text-5xl sm:text-7xl md:text-8xl">{title}</h2>
        <AdinkraRule className="mt-6 text-gold" />
      </Reveal>
    </section>
  );
}
