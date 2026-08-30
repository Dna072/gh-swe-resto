"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Price } from "@/components/brand/price";
import { adminFetch, hasAdminToken, subscribeAdminToken } from "@/lib/admin/client";
import type { AnalyticsOverview } from "@/domains/analytics/models";

function locationLabel(city?: string, country?: string): string {
  return [city, country].filter(Boolean).join(", ") || "Unknown";
}

function actionLabel(name: string): string {
  return name.replaceAll("_", " ");
}

export function AnalyticsDashboard() {
  const signedIn = useSyncExternalStore(subscribeAdminToken, hasAdminToken, () => false);
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    let cancelled = false;
    adminFetch<AnalyticsOverview>("/api/admin/analytics")
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load analytics.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  if (!signedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        Paste the admin token above to load visitor and sales totals.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-xs uppercase tracking-[0.18em] text-earth">Visitors</p>
          <p className="mt-2 font-heading text-4xl">{data?.visitorsToday ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Today · {data?.visitorsWeek ?? 0} this week · {data?.uniqueSessions ?? 0} sessions
          </p>
        </article>
        <article className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-xs uppercase tracking-[0.18em] text-earth">Users on the list</p>
          <p className="mt-2 font-heading text-4xl">{data?.signupCount ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">Consented emails for menus and discounts</p>
        </article>
        <article className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <p className="text-xs uppercase tracking-[0.18em] text-earth">Paid sales</p>
          <p className="mt-2 font-heading text-4xl">
            <Price ore={data?.sales.paidTotalOre ?? 0} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.sales.paidCount ?? 0} paid · today <Price ore={data?.sales.todayPaidOre ?? 0} size="sm" />
          </p>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Sales</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>Paid this week</dt>
              <dd>
                <Price ore={data?.sales.weekPaidOre ?? 0} size="sm" />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Average paid order</dt>
              <dd>
                <Price ore={data?.sales.averagePaidOre ?? 0} size="sm" />
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Waiting for payment</dt>
              <dd>
                {data?.sales.pendingCount ?? 0} · <Price ore={data?.sales.pendingTotalOre ?? 0} size="sm" />
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Where people visit from</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(data?.byCountry ?? []).length === 0 ? (
              <li className="text-muted-foreground">No visitor locations yet. Browse the storefront to record a session.</li>
            ) : (
              data?.byCountry.map((row) => (
                <li key={row.country} className="flex justify-between gap-3">
                  <span>{row.country}</span>
                  <span className="text-muted-foreground">{row.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-2xl">Recent visitors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          City-level location from the request. We do not store IP addresses on this dashboard.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Session</th>
                <th className="py-2 pr-3 font-medium">Location</th>
                <th className="py-2 pr-3 font-medium">Last action</th>
                <th className="py-2 pr-3 font-medium">Actions</th>
                <th className="py-2 font-medium">List</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentVisitors ?? []).map((visitor) => (
                <tr key={visitor.sessionId} className="border-t border-border">
                  <td className="py-2 pr-3 font-mono text-xs">{visitor.sessionId.slice(0, 8)}</td>
                  <td className="py-2 pr-3">{locationLabel(visitor.city, visitor.country)}</td>
                  <td className="py-2 pr-3">
                    {actionLabel(visitor.lastAction)}
                    {visitor.path ? ` · ${visitor.path}` : ""}
                  </td>
                  <td className="py-2 pr-3">{visitor.actionCount}</td>
                  <td className="py-2">{visitor.signedUp ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Users who signed up</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(data?.signups ?? []).length === 0 ? (
              <li className="text-muted-foreground">No discount-list signups yet.</li>
            ) : (
              data?.signups.map((signup) => (
                <li key={signup.id}>
                  <p className="font-medium">{signup.email}</p>
                  <p className="text-muted-foreground">
                    {locationLabel(signup.city, signup.country)}
                    {signup.source ? ` · ${signup.source}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
          <h2 className="font-heading text-2xl">Recent actions</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(data?.recentActions ?? []).map((event) => (
              <li key={event.id} className="flex justify-between gap-3">
                <span>
                  {actionLabel(event.name)}
                  {event.path ? ` · ${event.path}` : ""}
                </span>
                <span className="text-muted-foreground">{locationLabel(event.city, event.country)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
