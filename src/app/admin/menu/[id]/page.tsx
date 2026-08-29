"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MealEditor } from "@/components/admin/meal-editor";
import { adminFetch } from "@/lib/admin/client";
import type { MenuCategory, MenuItem, ModifierGroup } from "@/domains/menu/models";

export default function EditMealPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminFetch<{ item: MenuItem }>(`/api/admin/menu/${params.id}`),
      adminFetch<{ categories: MenuCategory[]; modifierGroups: ModifierGroup[] }>("/api/admin/menu"),
    ])
      .then(([detail, list]) => {
        if (!cancelled) {
          setItem(detail.item);
          setCategories(list.categories);
          setModifierGroups(list.modifierGroups);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load meal.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-heading text-4xl">Edit meal</h1>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : item ? (
        <MealEditor initial={item} categories={categories} modifierGroups={modifierGroups} />
      ) : (
        <p>Loading meal…</p>
      )}
    </main>
  );
}
