"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/brand/field";
import { ActionResultDialog } from "@/components/admin/action-result-dialog";
import { useActionFeedback } from "@/components/admin/use-action-feedback";
import { adminFetch } from "@/lib/admin/client";
import type { Promotion, PromotionType } from "@/domains/promotions/models";

type Draft = {
  id?: string;
  code: string;
  type: PromotionType;
  percentOff: string;
  amountOffOre: string;
  minimumOrderOre: string;
  firstOrderOnly: boolean;
  memberOnly: boolean;
  active: boolean;
};

const emptyDraft: Draft = {
  code: "",
  type: "PERCENTAGE",
  percentOff: "10",
  amountOffOre: "",
  minimumOrderOre: "",
  firstOrderOnly: false,
  memberOnly: false,
  active: true,
};

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { feedback, succeed, fail, close } = useActionFeedback();

  useEffect(() => {
    adminFetch<{ promotions: Promotion[] }>("/api/admin/promotions")
      .then((body) => setPromotions(body.promotions))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Could not load promotions."));
  }, []);

  async function save() {
    setBusy(true);
    try {
      const payload = {
        id: draft.id,
        code: draft.code.trim().toUpperCase(),
        type: draft.type,
        percentOff: draft.type === "PERCENTAGE" ? Number(draft.percentOff) : undefined,
        amountOffOre: draft.type === "FIXED" ? Math.round(Number(draft.amountOffOre) * 100) : undefined,
        minimumOrderOre: draft.minimumOrderOre ? Math.round(Number(draft.minimumOrderOre) * 100) : undefined,
        firstOrderOnly: draft.firstOrderOnly,
        memberOnly: draft.memberOnly,
        active: draft.active,
      };
      const saved = await adminFetch<{ promotion: Promotion }>("/api/admin/promotions", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setPromotions((current) => {
        const without = current.filter((item) => item.id !== saved.promotion.id);
        return [saved.promotion, ...without];
      });
      setDraft(emptyDraft);
      succeed("Promotion saved", `${saved.promotion.code} is ${saved.promotion.active ? "active" : "inactive"}.`);
    } catch (cause) {
      fail("Not saved", cause instanceof Error ? cause.message : "Could not save the promotion.");
    } finally {
      setBusy(false);
    }
  }

  function edit(promotion: Promotion) {
    setDraft({
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      percentOff: promotion.percentOff != null ? String(promotion.percentOff) : "",
      amountOffOre: promotion.amountOffOre != null ? String(promotion.amountOffOre / 100) : "",
      minimumOrderOre: promotion.minimumOrderOre != null ? String(promotion.minimumOrderOre / 100) : "",
      firstOrderOnly: promotion.firstOrderOnly,
      memberOnly: promotion.memberOnly,
      active: promotion.active,
    });
  }

  if (error) {
    return <main className="mx-auto max-w-3xl px-4 py-10 text-destructive">{error}</main>;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-earth">Admin</p>
        <h1 className="mt-2 font-heading text-4xl">Promotions</h1>
        <p className="mt-3 text-muted-foreground">
          Codes apply at checkout. The cart quote and order total are calculated on the server.
        </p>
      </div>
      <section className="grid gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">{draft.id ? "Edit code" : "New code"}</h2>
        <Field id="code" label="Code">
          <Input id="code" value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
        </Field>
        <Field id="type" label="Type">
          <select
            id="type"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value as PromotionType })}
          >
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount (SEK)</option>
            <option value="FREE_DELIVERY">Free delivery</option>
          </select>
        </Field>
        {draft.type === "PERCENTAGE" ? (
          <Field id="percent" label="Percent off">
            <Input
              id="percent"
              inputMode="numeric"
              value={draft.percentOff}
              onChange={(event) => setDraft({ ...draft, percentOff: event.target.value })}
            />
          </Field>
        ) : null}
        {draft.type === "FIXED" ? (
          <Field id="amount" label="Amount off (SEK)">
            <Input
              id="amount"
              inputMode="decimal"
              value={draft.amountOffOre}
              onChange={(event) => setDraft({ ...draft, amountOffOre: event.target.value })}
            />
          </Field>
        ) : null}
        <Field id="minimum" label="Minimum order (SEK, optional)">
          <Input
            id="minimum"
            inputMode="decimal"
            value={draft.minimumOrderOre}
            onChange={(event) => setDraft({ ...draft, minimumOrderOre: event.target.value })}
          />
        </Field>
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={draft.firstOrderOnly}
            onCheckedChange={(checked) => setDraft({ ...draft, firstOrderOnly: checked === true })}
          />
          First order only
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={draft.memberOnly}
            onCheckedChange={(checked) => setDraft({ ...draft, memberOnly: checked === true })}
          />
          Members only
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Checkbox
            checked={draft.active}
            onCheckedChange={(checked) => setDraft({ ...draft, active: checked === true })}
          />
          Active
        </label>
        <div className="flex flex-wrap gap-3">
          <Button size="touch" disabled={busy || !draft.code.trim()} onClick={() => void save()}>
            {busy ? "Saving…" : "Save promotion"}
          </Button>
          {draft.id ? (
            <Button size="touch" variant="outline" onClick={() => setDraft(emptyDraft)}>
              New code
            </Button>
          ) : null}
        </div>
      </section>
      <ul className="divide-y divide-border rounded-2xl bg-card ring-1 ring-foreground/10">
        {promotions.map((promotion) => (
          <li key={promotion.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-mono text-sm text-earth">{promotion.code}</p>
              <p className="text-sm text-muted-foreground">
                {promotion.type.replaceAll("_", " ").toLowerCase()}
                {promotion.percentOff != null ? ` · ${promotion.percentOff}%` : ""}
                {promotion.active ? " · active" : " · inactive"}
              </p>
            </div>
            <Button size="touch" variant="outline" onClick={() => edit(promotion)}>
              Edit
            </Button>
          </li>
        ))}
      </ul>
      <ActionResultDialog feedback={feedback} onClose={close} />
    </main>
  );
}
