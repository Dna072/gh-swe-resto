import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import type {
  AnalyticsOverview,
  AnalyticsRecord,
  MarketingSignup,
  SalesTotals,
  VisitorSession,
} from "@/domains/analytics/models";
import type { AnalyticsRepository, MarketingSignupRepository } from "@/domains/analytics/repository";
import type { Order } from "@/domains/orders/models";
import type { OrderWriteRepository } from "@/domains/orders/repository";

function startOfDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

function isPaid(order: Order): boolean {
  return order.paymentStatus === "PAID";
}

export function salesFromOrders(orders: Order[], now = new Date()): SalesTotals {
  const today = startOfDay(now).toISOString();
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let paidCount = 0;
  let paidTotalOre = 0;
  let pendingCount = 0;
  let pendingTotalOre = 0;
  let todayPaidOre = 0;
  let weekPaidOre = 0;

  for (const order of orders) {
    if (isPaid(order)) {
      paidCount += 1;
      paidTotalOre += order.totalOre;
      if (order.createdAt >= today) {
        todayPaidOre += order.totalOre;
      }
      if (order.createdAt >= week) {
        weekPaidOre += order.totalOre;
      }
    } else if (order.orderStatus === "PENDING_PAYMENT") {
      pendingCount += 1;
      pendingTotalOre += order.totalOre;
    }
  }

  return {
    paidCount,
    paidTotalOre,
    pendingCount,
    pendingTotalOre,
    todayPaidOre,
    weekPaidOre,
    averagePaidOre: paidCount === 0 ? 0 : Math.round(paidTotalOre / paidCount),
  };
}

export function sessionsFromEvents(
  events: AnalyticsRecord[],
  signups: MarketingSignup[],
): VisitorSession[] {
  const signupSessions = new Set(
    signups.map((entry) => entry.email).filter(Boolean),
  );
  const bySession = new Map<string, VisitorSession>();

  for (const event of events) {
    const sessionId = event.sessionId ?? event.id;
    const existing = bySession.get(sessionId);
    if (!existing) {
      bySession.set(sessionId, {
        sessionId,
        firstSeen: event.occurredAt,
        lastSeen: event.occurredAt,
        actionCount: 1,
        lastAction: event.name,
        path: event.path,
        locale: event.locale,
        country: event.country,
        city: event.city,
        signedUp: event.name === "marketing_signup" || Boolean(event.properties.email && signupSessions.has(String(event.properties.email))),
      });
      continue;
    }
    existing.actionCount += 1;
    if (event.occurredAt > existing.lastSeen) {
      existing.lastSeen = event.occurredAt;
      existing.lastAction = event.name;
      existing.path = event.path ?? existing.path;
    }
    if (event.occurredAt < existing.firstSeen) {
      existing.firstSeen = event.occurredAt;
    }
    existing.country ??= event.country;
    existing.city ??= event.city;
    existing.locale ??= event.locale;
    if (event.name === "marketing_signup") {
      existing.signedUp = true;
    }
  }

  return [...bySession.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export class ReportsService {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly signups: MarketingSignupRepository,
    private readonly orders: OrderWriteRepository,
  ) {}

  async overview(actor: Actor, restaurantId: string, now = new Date()): Promise<AnalyticsOverview> {
    authorizationService.requirePermission(actor, "reports:read");
    const [events, signups, orderPage] = await Promise.all([
      this.analytics.listRecent(restaurantId, 400),
      this.signups.list(restaurantId),
      this.orders.list({ restaurantId }, { limit: 200 }),
    ]);

    const today = startOfDay(now).toISOString();
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sessions = sessionsFromEvents(events, signups);
    const visitorsToday = new Set(
      events.filter((event) => event.occurredAt >= today && event.sessionId).map((event) => event.sessionId),
    ).size;
    const visitorsWeek = new Set(
      events.filter((event) => event.occurredAt >= week && event.sessionId).map((event) => event.sessionId),
    ).size;

    const countryCounts = new Map<string, number>();
    for (const session of sessions) {
      const country = session.country ?? "Unknown";
      countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    }

    return {
      visitorsToday,
      visitorsWeek,
      uniqueSessions: sessions.length,
      byCountry: [...countryCounts.entries()]
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      recentVisitors: sessions.slice(0, 40),
      recentActions: events.slice(0, 40),
      signups,
      signupCount: signups.length,
      sales: salesFromOrders(orderPage.items, now),
    };
  }
}
