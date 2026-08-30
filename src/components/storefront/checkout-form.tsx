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
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/brand/empty-state";
import { ErrorState } from "@/components/brand/error-state";
import { Field } from "@/components/brand/field";
import { Price } from "@/components/brand/price";
import { Spinner } from "@/components/brand/loading-state";
import { AddressAutocomplete } from "@/components/checkout/address-autocomplete";
import { DeliverySlotFields } from "@/components/checkout/delivery-slot-fields";
import { useLocale, useT } from "@/components/i18n/locale-provider";
import { useCart } from "@/components/cart/cart-provider";
import { customerErrorMessage } from "@/lib/i18n/api-errors";
import { localizeMenuName } from "@/lib/i18n/catalog";
import { analyticsSessionId, track } from "@/lib/analytics/client";
import type { CartQuote } from "@/domains/cart/models";
import { rememberGuestOrder } from "@/lib/orders/guest-orders";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  line1: string;
  postalCode: string;
  city: string;
  lat?: number;
  lng?: number;
  formatted?: string;
  scheduledFor: string;
  specialInstructions?: string;
};

type DeliveryQuote = {
  key: string;
  zoneName: string;
  feeOre: number;
  feeLabel: string;
  etaMinutes: number;
  quoteId: string;
  deliveryEstimate: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
};

type CartQuoteResult = {
  key: string;
  quote: CartQuote | null;
  error: string | null;
};

export function CheckoutForm({ restaurantId }: { restaurantId: string }) {
  const t = useT();
  const { locale } = useLocale();
  const cart = useCart();
  const router = useRouter();
  const formSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("checkout.nameError")),
        email: z.email(t("checkout.emailError")),
        phone: z.string().min(6, t("checkout.phoneError")),
        line1: z.string().min(1, t("checkout.needAddress")),
        postalCode: z.string().min(3, t("checkout.needAddress")),
        city: z.string().min(1, t("checkout.needAddress")),
        lat: z.number().optional(),
        lng: z.number().optional(),
        formatted: z.string().optional(),
        scheduledFor: z.string().min(10, t("checkout.needSlot")),
        specialInstructions: z.string().max(300).optional(),
      }),
    [t],
  );
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
      name: "",
      email: "",
      phone: "",
      line1: "",
      postalCode: "",
      city: "Uppsala",
      scheduledFor: "",
      specialInstructions: "",
    },
  });

  const postalCode = form.watch("postalCode");
  const line1 = form.watch("line1");
  const city = form.watch("city");
  const lat = form.watch("lat");
  const lng = form.watch("lng");
  const scheduledFor = form.watch("scheduledFor");

  useEffect(() => {
    track("checkout_started", { lineCount: cart.lines.length });
  }, [cart.lines.length]);

  const postal = (postalCode ?? "").replace(/\s+/g, "");
  const deliveryKey = `${line1?.trim() ?? ""}:${postal}:${city?.trim() ?? ""}:${lat ?? ""}:${lng ?? ""}`;
  const canQuoteDelivery = postal.length >= 5 && Boolean(line1?.trim());

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
            lat,
            lng,
          },
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json()) as DeliveryQuote & {
            message?: string;
            code?: string;
            address?: { lat?: number; lng?: number; formatted?: string };
          };
          if (!response.ok) {
            setDeliveryResult({
              key: requestKey,
              quote: null,
              error: customerErrorMessage(body.code, t, "checkout.uppsalaOnly"),
            });
            return;
          }
          if (body.lat != null && body.lat !== lat) {
            form.setValue("lat", body.lat);
          }
          if (body.lng != null && body.lng !== lng) {
            form.setValue("lng", body.lng);
          }
          if (body.formattedAddress) {
            form.setValue("formatted", body.formattedAddress);
          }
          setDeliveryResult({ key: requestKey, quote: { ...body, key: requestKey }, error: null });
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setDeliveryResult({ key: requestKey, quote: null, error: t("checkout.quoteDeliveryError") });
        });
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // form.setValue is stable; listing `form` re-quotes on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canQuoteDelivery, city, deliveryKey, lat, line1, lng, postal, restaurantId, t]);

  const deliveryQuote = canQuoteDelivery && deliveryResult?.key === deliveryKey ? deliveryResult.quote : null;
  const deliveryError = canQuoteDelivery && deliveryResult?.key === deliveryKey ? deliveryResult.error : null;
  const deliveryFeeOre = deliveryQuote?.feeOre ?? 0;
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

  const cartKey = `${deliveryFeeOre}:${JSON.stringify(linesPayload)}`;
  const canQuoteCart = cart.lines.length > 0 && Boolean(deliveryQuote);

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
        const body = (await response.json()) as CartQuote & { message?: string; code?: string };
        if (!response.ok) {
          setCartResult({
            key: requestKey,
            quote: null,
            error: customerErrorMessage(body.code, t, "cart.priceError"),
          });
          return;
        }
        setCartResult({ key: requestKey, quote: body, error: null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCartResult({ key: requestKey, quote: null, error: t("cart.priceError") });
      });
    return () => controller.abort();
  }, [canQuoteCart, cartKey, deliveryFeeOre, linesPayload, restaurantId, t]);

  const cartQuote = canQuoteCart && cartResult?.key === cartKey ? cartResult.quote : null;
  const quoteError = canQuoteCart && cartResult?.key === cartKey ? cartResult.error : null;

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title={t("checkout.emptyTitle")}
        description={t("checkout.emptyBody")}
        action={
          <Button size="touch" asChild>
            <Link href="/menu">{t("cart.viewMenu")}</Link>
          </Button>
        }
      />
    );
  }

  async function onSubmit(values: FormValues) {
    if (!values.line1.trim() || !values.postalCode.trim()) {
      toast.error(t("checkout.needAddress"));
      return;
    }
    if (!deliveryQuote) {
      toast.error(deliveryError ?? t("checkout.waitQuote"));
      return;
    }
    if (!values.scheduledFor) {
      toast.error(t("checkout.needSlot"));
      return;
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
          fulfillment: "DELIVERY",
          scheduledFor: values.scheduledFor,
          lines: linesPayload,
          customer: {
            name: values.name.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            guestSessionId: analyticsSessionId(),
          },
          deliveryAddress: {
            line1: values.line1.trim(),
            postalCode: values.postalCode.replace(/\s+/g, ""),
            city: values.city.trim() || "Uppsala",
            country: "SE",
            lat: values.lat,
            lng: values.lng,
            formatted: values.formatted,
          },
          specialInstructions: values.specialInstructions?.trim() || undefined,
          guestSessionId: analyticsSessionId(),
        }),
      });
      const body = (await response.json()) as {
        order?: { id: string; publicOrderNumber: string };
        accessToken?: string;
        message?: string;
        code?: string;
      };
      if (!response.ok || !body.order || !body.accessToken) {
        toast.error(customerErrorMessage(body.code, t, "checkout.placeError"));
        return;
      }
      rememberGuestOrder({
        id: body.order.id,
        token: body.accessToken,
        publicOrderNumber: body.order.publicOrderNumber,
      });
      track("order_created", { orderId: body.order.id, publicOrderNumber: body.order.publicOrderNumber });
      cart.clear();
      toast.success(t("checkout.reserved", { number: body.order.publicOrderNumber }));
      router.push(`/orders/${body.order.id}?token=${encodeURIComponent(body.accessToken)}`);
    } catch {
      toast.error(t("checkout.placeError"));
    } finally {
      setSubmitting(false);
    }
  }

  const canPlace = !submitting && Boolean(cartQuote) && Boolean(deliveryQuote) && Boolean(scheduledFor);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <fieldset className="grid gap-4">
          <legend className="font-heading text-2xl">{t("checkout.contact")}</legend>
          <p className="text-sm text-muted-foreground">{t("checkout.contactHint")}</p>
          <Field id="name" label={t("checkout.name")} error={form.formState.errors.name?.message}>
            <Input id="name" autoComplete="name" {...form.register("name")} />
          </Field>
          <Field id="email" label={t("checkout.email")} error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <Field id="phone" label={t("checkout.phone")} hint={t("checkout.phoneHint")} error={form.formState.errors.phone?.message}>
            <Input id="phone" type="tel" autoComplete="tel" inputMode="tel" {...form.register("phone")} />
          </Field>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="font-heading text-2xl">{t("checkout.address")}</legend>
          <p className="text-sm text-muted-foreground">{t("checkout.addressHint")}</p>
          <Field id="line1" label={t("checkout.street")} error={form.formState.errors.line1?.message}>
            <AddressAutocomplete
              value={{
                line1: line1 ?? "",
                postalCode: postalCode ?? "",
                city: city ?? "Uppsala",
                lat,
                lng,
                formatted: form.watch("formatted"),
              }}
              onChange={(next) => {
                form.setValue("line1", next.line1, { shouldValidate: true });
                form.setValue("postalCode", next.postalCode, { shouldValidate: true });
                form.setValue("city", next.city || "Uppsala", { shouldValidate: true });
                form.setValue("lat", next.lat);
                form.setValue("lng", next.lng);
                form.setValue("formatted", next.formatted);
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="postalCode" label={t("delivery.postcode")}>
              <Input
                id="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="75322"
                {...form.register("postalCode")}
              />
            </Field>
            <Field id="city" label={t("checkout.city")}>
              <Input id="city" autoComplete="address-level2" {...form.register("city")} />
            </Field>
          </div>
          {deliveryQuote ? (
            <p role="status" className="text-sm text-forest">
              {t("checkout.deliveryQuote", {
                zone: deliveryQuote.zoneName,
                fee: deliveryQuote.feeLabel,
                eta: deliveryQuote.etaMinutes,
              })}
            </p>
          ) : null}
          {deliveryError ? (
            <p role="alert" className="text-sm text-destructive">
              {deliveryError}
            </p>
          ) : null}
        </fieldset>

        <DeliverySlotFields
          value={scheduledFor}
          onChange={(iso) => form.setValue("scheduledFor", iso, { shouldValidate: true })}
          error={form.formState.errors.scheduledFor?.message}
        />

        <Field id="notes" label={t("checkout.notes")}>
          <Textarea id="notes" maxLength={300} {...form.register("specialInstructions")} />
        </Field>
      </div>

      <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">{t("checkout.payLater")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("checkout.payLaterHint")}</p>
        {!cartQuote && !quoteError ? <Spinner className="mt-4" label={t("checkout.pricing")} /> : null}
        {quoteError ? <ErrorState className="mt-4" message={quoteError} /> : null}
        {cartQuote ? (
          <dl className="mt-4 space-y-2 text-sm">
            {cartQuote.lines.map((line) => (
              <div key={`${line.menuItemId}-${line.name}`} className="flex justify-between gap-3">
                <dt>
                  {line.quantity}× {localizeMenuName(line.menuItemId, line.name, locale)}
                </dt>
                <dd>
                  <Price ore={line.lineTotalOre} size="sm" />
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-3">
              <dt>{t("checkout.deliveryFee")}</dt>
              <dd>
                <Price ore={cartQuote.deliveryFeeOre} size="sm" />
              </dd>
            </div>
            <div className="flex justify-between gap-3 font-medium">
              <dt>{t("cart.total")}</dt>
              <dd>
                <Price ore={cartQuote.totalOre} />
              </dd>
            </div>
          </dl>
        ) : null}
        <Button size="touch" className="mt-6 w-full" type="submit" disabled={!canPlace}>
          {submitting ? t("checkout.placing") : t("checkout.place")}
        </Button>
      </aside>
    </form>
  );
}
