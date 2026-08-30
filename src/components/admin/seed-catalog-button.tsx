"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/admin/client";
import { ActionResultDialog } from "./action-result-dialog";
import { useActionFeedback } from "./use-action-feedback";

type SeedResponse = {
  seeded?: boolean;
  alreadyPresent?: boolean;
  message?: string;
  wrote?: number;
  restaurantId?: string;
};

export function SeedCatalogButton() {
  const { feedback, succeed, fail, close } = useActionFeedback();
  const [busy, setBusy] = useState(false);

  async function seed(force: boolean) {
    setBusy(true);
    try {
      const path = force ? "/api/admin/seed?force=true" : "/api/admin/seed";
      const result = await adminFetch<SeedResponse>(path, { method: "POST" });
      if (result.seeded) {
        succeed("Demo menu seeded", `Wrote ${result.wrote ?? 0} documents for ${result.restaurantId ?? "the restaurant"}.`);
        return;
      }
      succeed("Catalog unchanged", result.message ?? "Firestore already has a menu.");
    } catch (error) {
      fail("Could not seed Firestore", error instanceof Error ? error.message : "Seed failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="font-heading text-xl">Firestore demo catalog</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        If Cloud Run deployed but the menu is empty, paste the admin token above
        and seed the demo meals into Firestore. Safe to run again — it will not
        overwrite an existing menu unless you force it.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button size="touch" type="button" disabled={busy} onClick={() => void seed(false)}>
          {busy ? "Seeding…" : "Seed demo menu"}
        </Button>
        <Button size="touch" type="button" variant="outline" disabled={busy} onClick={() => void seed(true)}>
          Replace catalog
        </Button>
      </div>
      <ActionResultDialog feedback={feedback} onClose={close} />
    </div>
  );
}
