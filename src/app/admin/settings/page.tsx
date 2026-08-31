"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ActionResultDialog } from "@/components/admin/action-result-dialog";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { adminFetch } from "@/lib/admin/client";
import type { RestaurantSettings } from "@/domains/restaurant/settings";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { feedback, succeed, fail, close } = useActionFeedback();

  useEffect(() => {
    adminFetch<{ settings: RestaurantSettings }>("/api/admin/restaurant-settings")
      .then((body) => setSettings(body.settings))
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Could not load restaurant settings."),
      );
  }, []);

  async function save() {
    if (!settings) {
      return;
    }
    setBusy(true);
    try {
      const saved = await adminFetch<{ settings: RestaurantSettings }>("/api/admin/restaurant-settings", {
        method: "PUT",
        body: JSON.stringify({ orderingPaused: settings.orderingPaused }),
      });
      setSettings(saved.settings);
      succeed(
        settings.orderingPaused ? "Ordering paused" : "Ordering open",
        settings.orderingPaused
          ? "Guests can browse the menu but cannot place new orders."
          : "Guests can place delivery orders again.",
      );
    } catch (cause) {
      fail("Not saved", cause instanceof Error ? cause.message : "Could not save restaurant settings.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-destructive">{error}</main>;
  }
  if (!settings) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-muted-foreground">Loading settings…</main>;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Admin</p>
        <h1 className="mt-2 font-heading text-4xl">Restaurant settings</h1>
        <p className="mt-3 text-muted-foreground">
          Pause ordering when the kitchen cannot take new plates. Existing paid tickets stay on the
          board.
        </p>
      </div>
      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={settings.orderingPaused}
            onCheckedChange={(checked) => setSettings({ ...settings, orderingPaused: checked === true })}
          />
          Pause ordering
        </label>
        <Button size="touch" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save settings"}
        </Button>
      </section>
      <ActionResultDialog feedback={feedback} onClose={close} />
    </main>
  );
}
