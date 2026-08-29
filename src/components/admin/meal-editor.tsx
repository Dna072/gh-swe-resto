"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/brand/field";
import { MealCard } from "@/components/brand/meal-card";
import { FoodPhoto } from "@/components/brand/food-photo";
import { Price } from "@/components/brand/price";
import { adminFetch } from "@/lib/admin/client";
import { imageAlt, imageUrl, objectPosition, primaryImage } from "@/lib/media/display";
import { oreToSek, sekToOre } from "@/lib/money";
import type { Allergen, DietaryTag, MenuCategory, MenuItem, ModifierGroup } from "@/domains/menu/models";

const ALLERGENS: Allergen[] = [
  "GLUTEN",
  "MILK",
  "EGG",
  "FISH",
  "CRUSTACEAN",
  "PEANUT",
  "SOY",
  "NUTS",
  "CELERY",
  "MUSTARD",
  "SESAME",
  "SULPHITES",
  "LUPIN",
  "MOLLUSC",
];

const DIETARY: DietaryTag[] = ["HALAL", "VEGETARIAN", "VEGAN", "GLUTEN_FREE", "SPICY"];

export function MealEditor({
  initial,
  categories,
  modifierGroups,
}: {
  initial?: MenuItem;
  categories: MenuCategory[];
  modifierGroups: ModifierGroup[];
}) {
  const [item, setItem] = useState<MenuItem | undefined>(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [shortDescription, setShortDescription] = useState(initial?.shortDescription ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? "plates");
  const [basePrice, setBasePrice] = useState(initial ? String(oreToSek(initial.basePriceOre)) : "129");
  const [weekdayPrice, setWeekdayPrice] = useState(
    initial?.weekdayPriceOre ? String(oreToSek(initial.weekdayPriceOre)) : "",
  );
  const [weekendPrice, setWeekendPrice] = useState(
    initial?.weekendPriceOre ? String(oreToSek(initial.weekendPriceOre)) : "",
  );
  const [prep, setPrep] = useState(String(initial?.preparationTimeMinutes ?? 25));
  const [available, setAvailable] = useState(initial?.isAvailable ?? true);
  const [featured, setFeatured] = useState(initial?.isFeatured ?? false);
  const [popular, setPopular] = useState(initial?.isPopular ?? false);
  const [inventoryTracked, setInventoryTracked] = useState(initial?.inventoryTracked ?? false);
  const [sku, setSku] = useState(initial?.inventorySku ?? "");
  const [quantity, setQuantity] = useState(String(initial?.availableQuantity ?? 20));
  const [threshold, setThreshold] = useState(String(initial?.lowStockThreshold ?? 5));
  const [allergens, setAllergens] = useState<Allergen[]>(initial?.allergens ?? []);
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>(initial?.dietaryTags ?? []);
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>(initial?.modifierGroupIds ?? []);
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"card" | "detail" | "mobile">("card");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const draftPriceOre = useMemo(() => {
    try {
      return sekToOre(Number(basePrice || 0));
    } catch {
      return 0;
    }
  }, [basePrice]);

  const photo = item ? primaryImage(item.images) : undefined;

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const payload = {
        id: item?.id,
        slug: slug || slugFromName(name),
        name,
        description,
        shortDescription,
        categoryId,
        basePriceOre: sekToOre(Number(basePrice)),
        weekdayPriceOre: weekdayPrice ? sekToOre(Number(weekdayPrice)) : undefined,
        weekendPriceOre: weekendPrice ? sekToOre(Number(weekendPrice)) : undefined,
        isAvailable: available,
        isFeatured: featured,
        isPopular: popular,
        inventoryTracked,
        inventorySku: sku || undefined,
        availableQuantity: inventoryTracked ? Number(quantity) : undefined,
        lowStockThreshold: inventoryTracked ? Number(threshold) : undefined,
        preparationTimeMinutes: Number(prep),
        allergens,
        dietaryTags,
        modifierGroupIds,
      };
      const saved = await adminFetch<{ item: MenuItem }>(item?.id ? `/api/admin/menu/${item.id}` : "/api/admin/menu", {
        method: item?.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setItem(saved.item);
      setStatus("Meal saved. Upload a real kitchen photograph next.");
      if (!item?.id) {
        window.history.replaceState(null, "", `/admin/menu/${saved.item.id}`);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save meal.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage() {
    if (!item?.id || !file || !altText.trim()) {
      setStatus("Save the meal, then choose a photograph and write alt text.");
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("altText", altText.trim());
      const saved = await adminFetch<{ item: MenuItem }>(`/api/admin/menu/${item.id}/images`, {
        method: "POST",
        body,
      });
      setItem(saved.item);
      setFile(null);
      setPreviewUrl(null);
      setStatus("Photograph stored. The storefront will use this image.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function mutateImage(imageId: string, action: "primary" | "remove") {
    if (!item?.id) {
      return;
    }
    setBusy(true);
    try {
      const saved = await adminFetch<{ item: MenuItem }>(`/api/admin/menu/${item.id}/images/${imageId}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setItem(saved.item);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update photograph.");
    } finally {
      setBusy(false);
    }
  }

  async function setFocus(imageId: string, x: number, y: number) {
    if (!item?.id) {
      return;
    }
    const saved = await adminFetch<{ item: MenuItem }>(`/api/admin/menu/${item.id}/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "focus", focalPointX: x, focalPointY: y }),
    });
    setItem(saved.item);
  }

  async function archive(next: boolean) {
    if (!item?.id) {
      return;
    }
    const saved = await adminFetch<{ item: MenuItem }>(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: next }),
    });
    setItem(saved.item);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field id="name" label="Name">
          <Input
            id="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!item) {
                setSlug(slugFromName(event.target.value));
              }
            }}
            required
          />
        </Field>
        <Field id="slug" label="Slug">
          <Input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        </Field>
        <Field id="short" label="Short description">
          <Input
            id="short"
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            required
          />
        </Field>
        <Field id="description" label="Description">
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </Field>
        <Field id="category" label="Category">
          <select
            id="category"
            className="h-11 rounded-lg border border-input bg-background px-3"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="price" label="Price (SEK)">
            <Input id="price" inputMode="decimal" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} />
          </Field>
          <Field id="weekday" label="Weekday price">
            <Input id="weekday" inputMode="decimal" value={weekdayPrice} onChange={(event) => setWeekdayPrice(event.target.value)} />
          </Field>
          <Field id="weekend" label="Weekend price">
            <Input id="weekend" inputMode="decimal" value={weekendPrice} onChange={(event) => setWeekendPrice(event.target.value)} />
          </Field>
        </div>
        <Field id="prep" label="Preparation time (minutes)">
          <Input id="prep" inputMode="numeric" value={prep} onChange={(event) => setPrep(event.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <ToggleRow label="Available" checked={available} onChange={setAvailable} />
          <ToggleRow label="Featured" checked={featured} onChange={setFeatured} />
          <ToggleRow label="Popular" checked={popular} onChange={setPopular} />
        </div>
        <ToggleRow label="Track inventory" checked={inventoryTracked} onChange={setInventoryTracked} />
        {inventoryTracked ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="sku" label="SKU">
              <Input id="sku" value={sku} onChange={(event) => setSku(event.target.value)} />
            </Field>
            <Field id="qty" label="Quantity">
              <Input id="qty" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </Field>
            <Field id="low" label="Low-stock threshold">
              <Input id="low" inputMode="numeric" value={threshold} onChange={(event) => setThreshold(event.target.value)} />
            </Field>
          </div>
        ) : null}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Allergens</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ALLERGENS.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={allergens.includes(value)}
                  onCheckedChange={(checked) =>
                    setAllergens((current) =>
                      checked === true ? [...current, value] : current.filter((entry) => entry !== value),
                    )
                  }
                />
                {value.toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Dietary tags</legend>
          <div className="flex flex-wrap gap-3">
            {DIETARY.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={dietaryTags.includes(value)}
                  onCheckedChange={(checked) =>
                    setDietaryTags((current) =>
                      checked === true ? [...current, value] : current.filter((entry) => entry !== value),
                    )
                  }
                />
                {value.replaceAll("_", " ").toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Modifiers</legend>
          {modifierGroups.map((group) => (
            <label key={group.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={modifierGroupIds.includes(group.id)}
                onCheckedChange={(checked) =>
                  setModifierGroupIds((current) =>
                    checked === true ? [...current, group.id] : current.filter((entry) => entry !== group.id),
                  )
                }
              />
              {group.name}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="touch" disabled={busy}>
            Save meal
          </Button>
          {item?.id ? (
            <Button type="button" size="touch" variant="outline" onClick={() => void archive(!item.archivedAt)}>
              {item.archivedAt ? "Restore" : "Archive"}
            </Button>
          ) : null}
          {item?.slug ? (
            <Button type="button" size="touch" variant="outline" asChild>
              <Link href={`/menu/${item.slug}`} target="_blank" rel="noreferrer">
                Open storefront
              </Link>
            </Button>
          ) : null}
        </div>
      </form>

      <aside className="space-y-6">
        <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Photograph</h2>
          <p className="text-sm text-muted-foreground">
            Upload a real photo of this meal. AI-generated food is not allowed.
          </p>
          <Field id="alt" label="Alt text" hint='Describe the actual plate, e.g. "Jollof rice with grilled chicken".'>
            <Input id="alt" value={altText} onChange={(event) => setAltText(event.target.value)} />
          </Field>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Meal photograph"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              setFile(next);
              setPreviewUrl(next ? URL.createObjectURL(next) : null);
            }}
          />
          {previewUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              {/* Local object URL preview before upload — not a production asset. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Upload preview" className="size-full object-cover" />
            </div>
          ) : null}
          <Button type="button" size="touch" disabled={busy || !item?.id} onClick={() => void uploadImage()}>
            Upload photograph
          </Button>
          <ul className="space-y-4">
            {(item?.images ?? [])
              .filter((image) => image.status !== "PENDING_DELETE")
              .map((image) => {
                const id = image.id ?? image.storagePath;
                return (
                  <li key={id} className="space-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <FoodPhoto
                        src={imageUrl(image, "thumbnail")}
                        alt={imageAlt(image, name)}
                        name={name}
                        sizes="320px"
                        objectPosition={objectPosition(image)}
                        className="size-full"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void mutateImage(id, "primary")}>
                        {image.isPrimary ? "Primary" : "Make primary"}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void mutateImage(id, "remove")}>
                        Remove
                      </Button>
                    </div>
                    <Field id={`focus-x-${id}`} label="Focal point X">
                      <Input
                        id={`focus-x-${id}`}
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((image.focalPointX ?? 0.5) * 100)}
                        onChange={(event) =>
                          void setFocus(id, Number(event.target.value) / 100, image.focalPointY ?? 0.5)
                        }
                      />
                    </Field>
                    <Field id={`focus-y-${id}`} label="Focal point Y">
                      <Input
                        id={`focus-y-${id}`}
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round((image.focalPointY ?? 0.5) * 100)}
                        onChange={(event) =>
                          void setFocus(id, image.focalPointX ?? 0.5, Number(event.target.value) / 100)
                        }
                      />
                    </Field>
                  </li>
                );
              })}
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <div className="flex flex-wrap gap-2">
            {(["card", "detail", "mobile"] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={previewMode === mode ? "default" : "outline"}
                onClick={() => setPreviewMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
          <div className={previewMode === "mobile" ? "mx-auto w-[min(100%,390px)]" : undefined}>
            {previewMode === "card" || previewMode === "mobile" ? (
              <MealCard
                name={name || "Meal name"}
                description={shortDescription || "Short description"}
                priceOre={draftPriceOre}
                imageAlt={imageAlt(photo, name || "Meal")}
                imageUrl={imageUrl(photo, "card")}
                imagePosition={objectPosition(photo)}
                featured={popular}
                dietaryLabels={dietaryTags.map((tag) => tag.replaceAll("_", " ").toLowerCase())}
              />
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <FoodPhoto
                    src={imageUrl(photo, "menu")}
                    alt={imageAlt(photo, name || "Meal")}
                    name={name || "Meal name"}
                    sizes="420px"
                    objectPosition={objectPosition(photo)}
                    className="size-full"
                  />
                </div>
                <h3 className="font-heading text-2xl">{name || "Meal name"}</h3>
                <p className="text-sm text-muted-foreground">{description || "Full description"}</p>
                <Price ore={draftPriceOre} />
              </div>
            )}
          </div>
        </section>
      </aside>
      {status ? (
        <p role="status" className="lg:col-span-2 text-sm text-muted-foreground">
          {status}
        </p>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function slugFromName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
