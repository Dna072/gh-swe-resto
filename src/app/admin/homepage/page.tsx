"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/brand/field";
import { FoodPhoto } from "@/components/brand/food-photo";
import { adminFetch } from "@/lib/admin/client";
import { imageUrl } from "@/lib/media/display";
import type { HomepageContent } from "@/domains/content/models";
import type { MenuItem } from "@/domains/menu/models";

export default function AdminHomepagePage() {
  const [homepage, setHomepage] = useState<HomepageContent | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminFetch<{ homepage: HomepageContent }>("/api/admin/homepage"),
      adminFetch<{ items: MenuItem[] }>("/api/admin/menu"),
    ])
      .then(([content, menu]) => {
        if (!cancelled) {
          setHomepage(content.homepage);
          setItems(menu.items.filter((item) => !item.archivedAt));
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load homepage.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!homepage) {
      return;
    }
    setStatus(null);
    try {
      const saved = await adminFetch<{ homepage: HomepageContent }>("/api/admin/homepage", {
        method: "PUT",
        body: JSON.stringify({
          hero: {
            eyebrow: homepage.hero.eyebrow,
            title: homepage.hero.title,
            subtitle: homepage.hero.subtitle,
            primaryCta: homepage.hero.primaryCta,
            secondaryCta: homepage.hero.secondaryCta,
          },
          featuredMealIds: homepage.featuredMealIds,
          story: homepage.story,
          delivery: homepage.delivery,
          promotional: homepage.promotional,
        }),
      });
      setHomepage(saved.homepage);
      setStatus("Homepage copy saved.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Could not save homepage.");
    }
  }

  async function uploadHero() {
    if (!file || !altText.trim()) {
      setStatus("Choose a real restaurant photograph and write alt text.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("altText", altText.trim());
    body.set("mobile", mobile ? "true" : "false");
    try {
      const saved = await adminFetch<{ homepage: HomepageContent }>("/api/admin/homepage/hero-image", {
        method: "POST",
        body,
      });
      setHomepage(saved.homepage);
      setFile(null);
      setStatus("Hero photograph stored.");
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : "Hero upload failed.");
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p role="alert" className="text-destructive">
          {error}
        </p>
      </main>
    );
  }

  if (!homepage) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p>Loading homepage…</p>
      </main>
    );
  }

  const heroSrc = imageUrl(mobile ? homepage.hero.mobileImage : homepage.hero.image, "hero");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="font-heading text-4xl">Homepage content</h1>
        <p className="mt-2 text-muted-foreground">
          Change copy and photographs. The layout stays developer-defined — this is not a page builder.
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Hero</h2>
        <Field id="eyebrow" label="Eyebrow">
          <Input
            id="eyebrow"
            value={homepage.hero.eyebrow}
            onChange={(event) =>
              setHomepage({ ...homepage, hero: { ...homepage.hero, eyebrow: event.target.value } })
            }
          />
        </Field>
        <Field id="title" label="Title">
          <Textarea
            id="title"
            value={homepage.hero.title}
            onChange={(event) =>
              setHomepage({ ...homepage, hero: { ...homepage.hero, title: event.target.value } })
            }
          />
        </Field>
        <Field id="subtitle" label="Subtitle">
          <Textarea
            id="subtitle"
            value={homepage.hero.subtitle}
            onChange={(event) =>
              setHomepage({ ...homepage, hero: { ...homepage.hero, subtitle: event.target.value } })
            }
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="cta1" label="Primary CTA label">
            <Input
              id="cta1"
              value={homepage.hero.primaryCta.label}
              onChange={(event) =>
                setHomepage({
                  ...homepage,
                  hero: {
                    ...homepage.hero,
                    primaryCta: { ...homepage.hero.primaryCta, label: event.target.value },
                  },
                })
              }
            />
          </Field>
          <Field id="cta1h" label="Primary CTA href">
            <Input
              id="cta1h"
              value={homepage.hero.primaryCta.href}
              onChange={(event) =>
                setHomepage({
                  ...homepage,
                  hero: {
                    ...homepage.hero,
                    primaryCta: { ...homepage.hero.primaryCta, href: event.target.value },
                  },
                })
              }
            />
          </Field>
          <Field id="cta2" label="Secondary CTA label">
            <Input
              id="cta2"
              value={homepage.hero.secondaryCta.label}
              onChange={(event) =>
                setHomepage({
                  ...homepage,
                  hero: {
                    ...homepage.hero,
                    secondaryCta: { ...homepage.hero.secondaryCta, label: event.target.value },
                  },
                })
              }
            />
          </Field>
          <Field id="cta2h" label="Secondary CTA href">
            <Input
              id="cta2h"
              value={homepage.hero.secondaryCta.href}
              onChange={(event) =>
                setHomepage({
                  ...homepage,
                  hero: {
                    ...homepage.hero,
                    secondaryCta: { ...homepage.hero.secondaryCta, href: event.target.value },
                  },
                })
              }
            />
          </Field>
        </div>
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-ink">
          {heroSrc ? (
            <FoodPhoto
              src={heroSrc}
              alt={homepage.hero.image?.altText ?? "Homepage hero"}
              name="Hero"
              sizes="800px"
              className="size-full"
            />
          ) : (
            <p className="p-6 text-sm text-primary-foreground">Photograph coming soon</p>
          )}
        </div>
        <Field id="hero-alt" label="Hero photograph alt text">
          <Input id="hero-alt" value={altText} onChange={(event) => setAltText(event.target.value)} />
        </Field>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label="Hero photograph"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={mobile} onCheckedChange={(checked) => setMobile(checked === true)} />
          Upload as mobile-specific hero
        </label>
        <Button type="button" size="touch" onClick={() => void uploadHero()}>
          Upload hero photograph
        </Button>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Featured meals</h2>
        <p className="text-sm text-muted-foreground">Choose which meals appear in the signature section.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={homepage.featuredMealIds.includes(item.id)}
                  onCheckedChange={(checked) => {
                    const next =
                      checked === true
                        ? [...homepage.featuredMealIds, item.id]
                        : homepage.featuredMealIds.filter((id) => id !== item.id);
                    setHomepage({ ...homepage, featuredMealIds: next.slice(0, 8) });
                  }}
                />
                {item.name}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <CopyBlock
        title="Story"
        value={homepage.story}
        onChange={(story) => setHomepage({ ...homepage, story })}
      />
      <CopyBlock
        title="Delivery"
        value={homepage.delivery}
        onChange={(delivery) => setHomepage({ ...homepage, delivery })}
      />
      <CopyBlock
        title="Promotional"
        value={homepage.promotional}
        onChange={(promotional) => setHomepage({ ...homepage, promotional })}
      />

      <Button size="touch" onClick={() => void save()}>
        Save homepage
      </Button>
      {status ? <p role="status">{status}</p> : null}
    </main>
  );
}

function CopyBlock({
  title,
  value,
  onChange,
}: {
  title: string;
  value: { eyebrow: string; title: string; body: string };
  onChange: (value: { eyebrow: string; title: string; body: string }) => void;
}) {
  const prefix = title.toLowerCase();
  return (
    <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <h2 className="font-heading text-2xl">{title}</h2>
      <Field id={`${prefix}-eyebrow`} label="Eyebrow">
        <Input
          id={`${prefix}-eyebrow`}
          value={value.eyebrow}
          onChange={(event) => onChange({ ...value, eyebrow: event.target.value })}
        />
      </Field>
      <Field id={`${prefix}-title`} label="Title">
        <Input
          id={`${prefix}-title`}
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
        />
      </Field>
      <Field id={`${prefix}-body`} label="Body">
        <Textarea
          id={`${prefix}-body`}
          value={value.body}
          onChange={(event) => onChange({ ...value, body: event.target.value })}
        />
      </Field>
    </section>
  );
}
