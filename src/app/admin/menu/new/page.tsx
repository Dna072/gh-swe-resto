"use client";

import { useEffect, useState } from "react";
import { MealEditor } from "@/components/admin/meal-editor";
import { adminFetch } from "@/lib/admin/client";
import type { MenuCategory, ModifierGroup } from "@/domains/menu/models";

export default function NewMealPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ categories: MenuCategory[]; modifierGroups: ModifierGroup[] }>("/api/admin/menu")
      .then((payload) => {
        if (!cancelled) {
          setCategories(payload.categories);
          setModifierGroups(payload.modifierGroups);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load menu options.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-heading text-4xl">Create meal</h1>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : (
        <MealEditor categories={categories} modifierGroups={modifierGroups} />
      )}
    </main>
  );
}
