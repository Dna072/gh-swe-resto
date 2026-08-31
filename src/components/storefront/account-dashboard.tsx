"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/brand/field";
import { useT } from "@/components/i18n/locale-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import {
  clearCustomerToken,
  customerFetch,
  hasCustomerToken,
  setCustomerToken,
  subscribeCustomerToken,
} from "@/lib/account/client";
import { customerPasswordLoginAvailable, signInCustomerFirebase } from "@/lib/firebase/client";
import type { PublicOrder } from "@/lib/orders/public";
import { formatSlot } from "@/lib/orders/slot-format";
import { guestTokenFor } from "@/lib/orders/guest-orders";

type AccountCustomer = { id: string; email: string; name: string; phone?: string };
type AccountOrder = PublicOrder & {
  reviewed?: boolean;
  review?: { rating: number; comment?: string; status: string } | null;
};

function useSignedIn(): boolean {
  return useSyncExternalStore(subscribeCustomerToken, hasCustomerToken, () => false);
}

export function AccountDashboard() {
  const signedIn = useSignedIn();
  if (signedIn) {
    return <SignedInHome />;
  }
  return <AccountAuthForm />;
}

function AccountAuthForm() {
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function afterServerAuth(localToken: string | null) {
    if (localToken) {
      setCustomerToken(localToken);
      return;
    }
    if (customerPasswordLoginAvailable()) {
      const idToken = await signInCustomerFirebase(email, password);
      setCustomerToken(idToken);
      return;
    }
    throw new Error(t("account.signInError"));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "reset") {
        const response = await fetch("/api/account/password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!response.ok) {
          const body = (await response.json()) as { code?: string; message?: string };
          throw new Error(customerErrorMessage(body.code, t, "account.resetError"));
        }
        toast.success(t("account.resetSent"));
        setMode("signin");
        return;
      }
      if (mode === "signup") {
        const response = await fetch("/api/account/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, phone, password }),
        });
        const body = (await response.json()) as { localToken?: string | null; code?: string; message?: string };
        if (!response.ok) {
          throw new Error(customerErrorMessage(body.code, t, "account.signUpError"));
        }
        await afterServerAuth(body.localToken ?? null);
        toast.success(t("account.welcome"));
        return;
      }
      if (customerPasswordLoginAvailable()) {
        try {
          const idToken = await signInCustomerFirebase(email, password);
          setCustomerToken(idToken);
          toast.success(t("account.signedIn"));
          return;
        } catch {
          /* Fall through to the local account service when Firebase is unset. */
        }
      }
      const response = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json()) as { localToken?: string; code?: string; message?: string };
      if (!response.ok || !body.localToken) {
        throw new Error(customerErrorMessage(body.code, t, "account.signInError"));
      }
      setCustomerToken(body.localToken);
      toast.success(t("account.signedIn"));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : t("account.signInError");
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <form onSubmit={(event) => void onSubmit(event)} className="space-y-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex gap-2 text-sm">
          <Button type="button" variant={mode === "signin" ? "gold" : "ghost"} onClick={() => setMode("signin")}>
            {t("account.signIn")}
          </Button>
          <Button type="button" variant={mode === "signup" ? "gold" : "ghost"} onClick={() => setMode("signup")}>
            {t("account.signUp")}
          </Button>
          <Button type="button" variant={mode === "reset" ? "gold" : "ghost"} onClick={() => setMode("reset")}>
            {t("account.reset")}
          </Button>
        </div>
        {mode === "signup" ? (
          <>
            <Field id="account-name" label={t("account.name")}>
              <Input id="account-name" value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field id="account-phone" label={t("account.phone")}>
              <Input id="account-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
          </>
        ) : null}
        <Field id="account-email" label={t("account.email")}>
          <Input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        {mode !== "reset" ? (
          <Field id="account-password" label={t("account.password")}>
            <Input
              id="account-password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </Field>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="touch" variant="gold" disabled={busy}>
          {mode === "signup" ? t("account.create") : mode === "reset" ? t("account.sendReset") : t("account.signIn")}
        </Button>
        <p className="text-sm text-muted-foreground">{t("account.guestHint")}</p>
        <Button variant="gold-outline" size="touch" asChild>
          <Link href="/orders">{t("account.findOrder")}</Link>
        </Button>
      </form>
    </div>
  );
}

function SignedInHome() {
  const t = useT();
  const [customer, setCustomer] = useState<AccountCustomer | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    customerFetch<{ customer: AccountCustomer }>("/api/account/me")
      .then((me) => {
        setCustomer(me.customer);
        return customerFetch<{ orders: AccountOrder[] }>("/api/account/orders");
      })
      .then((list) => {
        setOrders(list.orders);
        setError(null);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : t("account.loadError"));
      });
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.orderStatus));
  const past = orders.filter((order) => ["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.orderStatus));

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">{t("account.hello", { name: customer?.name ?? "" })}</p>
        <Button
          variant="outline"
          onClick={() => {
            clearCustomerToken();
            toast.message(t("account.signedOut"));
          }}
        >
          {t("account.signOut")}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      ) : null}
      <section>
        <h2 className="font-heading text-3xl">{t("account.current")}</h2>
        {current.length === 0 ? <p className="mt-3 text-muted-foreground">{t("account.noCurrent")}</p> : null}
        <ul className="mt-4 grid gap-4">
          {current.map((order) => (
            <OrderCard key={order.id} order={order} t={t} onReviewed={load} />
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-3xl">{t("account.history")}</h2>
        {past.length === 0 ? <p className="mt-3 text-muted-foreground">{t("account.noHistory")}</p> : null}
        <ul className="mt-4 grid gap-4">
          {past.map((order) => (
            <OrderCard key={order.id} order={order} t={t} onReviewed={load} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function OrderCard({
  order,
  t,
  onReviewed,
}: {
  order: AccountOrder;
  t: ReturnType<typeof useT>;
  onReviewed: () => void;
}) {
  const href = guestTokenFor(order.id)
    ? `/orders/${order.id}?token=${encodeURIComponent(guestTokenFor(order.id)!)}`
    : `/orders/${order.id}`;
  return (
    <li className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-earth">{order.publicOrderNumber}</p>
          <p className="mt-1 font-heading text-2xl">{order.totalLabel}</p>
          {order.scheduledFor ? (
            <p className="text-sm text-muted-foreground">{formatSlot(order.scheduledFor, "sv")}</p>
          ) : null}
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {order.orderStatus.replaceAll("_", " ").toLowerCase()}
        </p>
      </div>
      <ol className="mt-4 space-y-1 text-sm">
        {order.tracking.map((step) => (
          <li
            key={step.status}
            className={step.current ? "font-medium text-earth" : step.done ? "text-foreground" : "text-muted-foreground"}
          >
            {step.label}
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="touch" variant="gold" asChild>
          <Link href={href}>{t("account.track")}</Link>
        </Button>
        {order.trackingUrl ? (
          <Button size="touch" variant="gold-outline" asChild>
            <a href={order.trackingUrl} target="_blank" rel="noreferrer">
              {t("account.courier")}
            </a>
          </Button>
        ) : null}
      </div>
      {order.reviewEligible ? <ReviewForm order={order} t={t} onReviewed={onReviewed} /> : null}
    </li>
  );
}

function ReviewForm({
  order,
  t,
  onReviewed,
}: {
  order: AccountOrder;
  t: ReturnType<typeof useT>;
  onReviewed: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (order.reviewed || order.review) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        {t("account.reviewThanks", { rating: String(order.review?.rating ?? "") })}
      </p>
    );
  }

  return (
    <form
      className="mt-5 space-y-3 border-t border-border pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        setBusy(true);
        void customerFetch(`/api/orders/${order.id}/review`, {
          method: "POST",
          body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
        })
          .then(() => {
            toast.success(t("account.reviewSaved"));
            onReviewed();
          })
          .catch((cause: unknown) => {
            toast.error(cause instanceof Error ? cause.message : t("account.reviewError"));
          })
          .finally(() => setBusy(false));
      }}
    >
      <p className="font-heading text-xl">{t("account.reviewTitle")}</p>
      <Field id={`rating-${order.id}`} label={t("account.rating")}>
        <select
          id={`rating-${order.id}`}
          className="h-11 w-full rounded-md border border-input bg-background px-3"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </Field>
      <Field id={`comment-${order.id}`} label={t("account.comment")}>
        <Textarea
          id={`comment-${order.id}`}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={600}
        />
      </Field>
      <Button type="submit" size="touch" disabled={busy}>
        {t("account.submitReview")}
      </Button>
    </form>
  );
}
