"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin/client";
import { formatSek } from "@/lib/money";
import { primaryImage } from "@/lib/media/display";
import type { MenuItem } from "@/domains/menu/models";

export default function AdminMenuListPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminFetch<{ items: MenuItem[] }>("/api/admin/menu")
      .then((payload) => {
        if (!cancelled) {
          setItems(payload.items);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load meals.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-4xl">Meals</h1>
          <p className="mt-2 text-muted-foreground">Create meals, then upload the restaurant&apos;s own photographs.</p>
        </div>
        <Button size="touch" asChild>
          <Link href="/admin/menu/new">Create meal</Link>
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-foreground/10">
        {items.map((item) => {
          const photo = primaryImage(item.images);
          return (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="font-heading text-xl">{item.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatSek(item.basePriceOre)} · {photo ? "Photograph ready" : "Photo coming soon"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.archivedAt ? <Badge variant="secondary">Archived</Badge> : null}
                {!item.isAvailable ? <Badge variant="outline">Hidden</Badge> : null}
                <Button size="touch" variant="outline" asChild>
                  <Link href={`/admin/menu/${item.id}`}>Edit</Link>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
