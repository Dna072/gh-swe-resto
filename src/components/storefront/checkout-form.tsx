"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/brand/empty-state";
import { ErrorState } from "@/components/brand/error-state";
import { Field } from "@/components/brand/field";
import { Price } from "@/components/brand/price";
import { Spinner } from "@/components/brand/loading-state";
import { useCart } from "@/components/cart/cart-provider";
import { analyticsSessionId, track } from "@/lib/analytics/client";
import type { CartQuote } from "@/domains/cart/models";
import { rememberGuestOrder } from "@/lib/orders/guest-orders";
import type { AddressSnapshot } from "@/domains/shared/types";

const formSchema = z.object({
  fulfillment: z.enum(["DELIVERY", "PICKUP"]),
  name: z.string().min(1, "Enter your name"),
  email: z.email("Enter a valid email"),
  phone: z.string().min(6, "Enter a phone number"),
  line1: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  specialInstructions: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type DeliveryQuote = {
  key: string;
  zoneName: string;
  feeOre: number;
  feeLabel: string;
  etaMinutes: number;
  quoteId: string;
  deliveryEstimate: string;
};

type CartQuoteResult = {
  key: string;
  quote: CartQuote | null;
  error: string | null;
};

type Pickup = AddressSnapshot;

export function CheckoutForm({
  restaurantId,
  pickup,
}: {
  restaurantId: string;
  pickup: Pickup;
}) {
  const cart = useCart();
  const router = useRouter();
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : "checkout-pending",
  );
  const [deliveryResult, setDeliveryResult] = useState<
    { key: string; quote: DeliveryQuote | null; error: string | null } | null
  >(null);
  const [cartResult, setCartResult] = useState<CartQuoteResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fulfillment: "DELIVERY",
      name: "",
      email: "",
      phone: "",
      line1: "",
      postalCode: "",
      city: "Uppsala",
      specialInstructions: "",
    },
  });

  const fulfillment = form.watch("fulfillment");
  const postalCode = form.watch("postalCode");
  const line1 = form.watch("line1");
  const city = form.watch("city");

  useEffect(() => {
    track("checkout_started", { lineCount: cart.lines.length });
  }, [cart.lines.length]);

  const postal = (postalCode ?? "").replace(/\s+/g, "");
  const deliveryKey = `${fulfillment}:${line1?.trim() ?? ""}:${postal}:${city?.trim() ?? ""}`;
  const canQuoteDelivery = fulfillment === "DELIVERY" && postal.length >= 5 && Boolean(line1?.trim());

  useEffect(() => {
    if (!canQuoteDelivery) {
      return;
    }
    const requestKey = deliveryKey;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/delivery/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          address: {
            line1: line1?.trim(),
            postalCode: postal,
            city: city?.trim() || "Uppsala",
            country: "SE",
          },
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json()) as DeliveryQuote & { message?: string };
          if (!response.ok) {
            setDeliveryResult({ key: requestKey, quote: null, error: body.message ?? "We cannot deliver there yet." });
            return;
          }
          setDeliveryResult({ key: requestKey, quote: { ...body, key: requestKey }, error: null });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setDeliveryResult({ key: requestKey, quote: null, error: "We could not quote delivery." });
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canQuoteDelivery, city, deliveryKey, line1, postal, restaurantId]);

  const deliveryQuote = canQuoteDelivery && deliveryResult?.key === deliveryKey ? deliveryResult.quote : null;
  const deliveryError = canQuoteDelivery && deliveryResult?.key === deliveryKey ? deliveryResult.error : null;
  const deliveryFeeOre = fulfillment === "PICKUP" ? 0 : (deliveryQuote?.feeOre ?? 0);
  const linesPayload = useMemo(
    () =>
      cart.lines.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        modifiers: line.modifiers,
        notes: line.notes,
      })),
    [cart.lines],
  );

  const cartKey = `${fulfillment}:${deliveryFeeOre}:${JSON.stringify(linesPayload)}`;
  const canQuoteCart = cart.lines.length > 0 && (fulfillment === "PICKUP" || Boolean(deliveryQuote));

  useEffect(() => {
    if (!canQuoteCart) {
      return;
    }
    const requestKey = cartKey;
    const controller = new AbortController();
    void fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        lines: linesPayload,
        deliveryFeeOre,
        guestSessionId: analyticsSessionId(),
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as CartQuote & { message?: string };
        if (!response.ok) {
          setCartResult({ key: requestKey, quote: null, error: body.message ?? "We could not price this cart." });
          return;
        }
        setCartResult({ key: requestKey, quote: body, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCartResult({ key: requestKey, quote: null, error: "We could not price this cart." });
      });
    return () => controller.abort();
  }, [canQuoteCart, cartKey, deliveryFeeOre, linesPayload, restaurantId]);

  const cartQuote = canQuoteCart && cartResult?.key === cartKey ? cartResult.quote : null;
  const quoteError = canQuoteCart && cartResult?.key === cartKey ? cartResult.error : null;

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out"
        description="Add a plate first. Guest checkout keeps your cart on this device."
        action={
          <Button size="touch" asChild>
            <Link href="/menu">View today’s menu</Link>
          </Button>
        }
      />
    );
  }

  async function onSubmit(values: FormValues) {
    if (values.fulfillment === "DELIVERY") {
      if (!values.line1?.trim() || !values.postalCode?.trim()) {
        toast.error("Enter a street address and postcode.");
        return;
      }
      if (!deliveryQuote) {
        toast.error(deliveryError ?? "Wait for the delivery quote.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          restaurantId,
          fulfillment: values.fulfillment,
          lines: linesPayload,
          customer: {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            guestSessionId: analyticsSessionId(),
          },
          deliveryAddress:
            values.fulfillment === "DELIVERY"
              ? {
                  line1: values.line1?.trim(),
                  postalCode: values.postalCode?.replace(/\s+/g, ""),
                  city: values.city?.trim() || "Uppsala",
                  country: "SE",
                }
              : undefined,
          specialInstructions: values.specialInstructions?.trim() || undefined,
          guestSessionId: analyticsSessionId(),
        }),
      });
      const body = (await response.json()) as {
        order?: { id: string; publicOrderNumber: string };
        accessToken?: string;
        message?: string;
      };
      if (!response.ok || !body.order || !body.accessToken) {
        toast.error(body.message ?? "We could not place this order.");
        return;
      }
      rememberGuestOrder({
        id: body.order.id,
        token: body.accessToken,
        publicOrderNumber: body.order.publicOrderNumber,
      });
      track("order_created", { orderId: body.order.id, publicOrderNumber: body.order.publicOrderNumber });
      cart.clear();
      toast.success(`${body.order.publicOrderNumber} is reserved.`);
      router.push(`/orders/${body.order.id}?token=${encodeURIComponent(body.accessToken)}`);
    } catch {
      toast.error("We could not place this order.");
    } finally {
      setSubmitting(false);
    }
  }

  const canPlace =
    !submitting &&
    Boolean(cartQuote) &&
    (fulfillment === "PICKUP" || Boolean(deliveryQuote));

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <fieldset className="space-y-3">
          <legend className="font-heading text-2xl">How should it arrive?</legend>
          <RadioGroup
            value={fulfillment}
            onValueChange={(value) => form.setValue("fulfillment", value as FormValues["fulfillment"])}
            className="gap-3"
          >
            <label className="flex min-h-14 items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              <RadioGroupItem value="DELIVERY" />
              <span>Delivery in Uppsala</span>
            </label>
            <label className="flex min-h-14 items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10">
              <RadioGroupItem value="PICKUP" />
              <span>Pickup — {pickup.line1}, {pickup.postalCode} {pickup.city}</span>
            </label>
          </RadioGroup>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="font-heading text-2xl">Contact</legend>
          <p className="text-sm text-muted-foreground">
            Guest checkout. You do not need an account. We use this to reach you about the order.
          </p>
          <Field id="name" label="Name" error={form.formState.errors.name?.message}>
            <Input id="name" autoComplete="name" {...form.register("name")} />
          </Field>
          <Field id="email" label="Email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <Field id="phone" label="Phone" hint="Swedish mobile, for example +4670…" error={form.formState.errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" {...form.register("phone")} />
          </Field>
        </fieldset>

        {fulfillment === "DELIVERY" ? (
          <fieldset className="grid gap-4">
            <legend className="font-heading text-2xl">Delivery address</legend>
            <Field id="line1" label="Street">
              <Input id="line1" autoComplete="address-line1" {...form.register("line1")} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="postalCode" label="Postcode">
                <Input
                  id="postalCode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="75322"
                  {...form.register("postalCode")}
                />
              </Field>
              <Field id="city" label="City">
                <Input id="city" autoComplete="address-level2" {...form.register("city")} />
              </Field>
            </div>
            {deliveryQuote ? (
              <p role="status" className="text-sm text-forest">
                {deliveryQuote.zoneName}: {deliveryQuote.feeLabel}, about {deliveryQuote.etaMinutes} minutes.
              </p>
            ) : null}
            {deliveryError ? (
              <p role="alert" className="text-sm text-destructive">
                {deliveryError}
              </p>
            ) : null}
          </fieldset>
        ) : (
          <p className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/10">
            Pickup is at {pickup.line1}, {pickup.postalCode} {pickup.city}. Confirm this kitchen
            address before launch.
          </p>
        )}

        <Field id="notes" label="Kitchen or courier notes">
          <Textarea id="notes" maxLength={300} {...form.register("specialInstructions")} />
        </Field>
      </div>

      <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">To pay later</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Totals are quoted on the server. Payment is Phase 5 — this demo only reserves the plate.
        </p>
        {!cartQuote && !quoteError ? <Spinner className="mt-4" label="Pricing order" /> : null}
        {quoteError ? <ErrorState className="mt-4" message={quoteError} /> : null}
        {cartQuote ? (
          <dl className="mt-4 space-y-2 text-sm">
            {cartQuote.lines.map((line) => (
              <div key={`${line.menuItemId}-${line.name}`} className="flex justify-between gap-3">
                <dt>
                  {line.quantity}× {line.name}
                </dt>
                <dd>
                  <Price ore={line.lineTotalOre} size="sm" />
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-3">
              <dt>Delivery</dt>
              <dd>
                <Price ore={cartQuote.deliveryFeeOre} size="sm" />
              </dd>
            </div>
            <div className="flex justify-between gap-3 font-medium">
              <dt>Total</dt>
              <dd>
                <Price ore={cartQuote.totalOre} />
              </dd>
            </div>
          </dl>
        ) : null}
        <Button size="touch" className="mt-6 w-full" type="submit" disabled={!canPlace}>
          {submitting ? "Placing order…" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}
