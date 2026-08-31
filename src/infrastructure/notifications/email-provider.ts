import { logger } from "@/lib/logging/logger";
import type { NotificationProvider } from "@/domains/notifications/provider";
import type { NotificationMessage } from "@/domains/notifications/models";
import { renderPremiumEmail } from "./templates";
import type { NotificationCopy } from "@/domains/notifications/models";
import { NOTIFICATION_COPY } from "@/domains/notifications/models";
import { storefrontOrigin } from "@/lib/brand/hosts";

export class MockEmailNotificationProvider implements NotificationProvider {
  readonly channel = "email" as const;
  readonly sent: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    this.sent.push(message);
    logger.info("Mock email queued", { event: message.event, orderId: message.orderId, to: message.to });
  }
}

export class SmtpEmailNotificationProvider implements NotificationProvider {
  readonly channel = "email" as const;

  async send(message: NotificationMessage): Promise<void> {
    logger.info("SMTP is not configured; message not sent", {
      event: message.event,
      orderId: message.orderId,
    });
  }
}

export function withPremiumHtml(message: NotificationMessage): NotificationMessage {
  if (message.html) {
    return message;
  }
  const copy: NotificationCopy = NOTIFICATION_COPY[message.event];
  const rendered = renderPremiumEmail({
    preheader: copy.subject,
    headline: copy.headline,
    body: message.body || copy.body,
    details: detailsFromVars(message.vars),
    ctaLabel: copy.ctaLabel,
    ctaUrl: message.vars?.ctaUrl ?? defaultCtaUrl(message),
  });
  return {
    ...message,
    subject: message.subject ?? copy.subject,
    body: rendered.text,
    html: rendered.html,
  };
}

function defaultCtaUrl(message: NotificationMessage): string | undefined {
  if (message.orderId) {
    return `${storefrontOrigin()}/orders/${message.orderId}`;
  }
  return `${storefrontOrigin()}/account`;
}

function detailsFromVars(vars?: Record<string, string>): Array<{ label: string; value: string }> | undefined {
  if (!vars) {
    return undefined;
  }
  const rows: Array<{ label: string; value: string }> = [];
  if (vars.guestName) {
    rows.push({ label: "Guest", value: vars.guestName });
  }
  if (vars.orderNumber) {
    rows.push({ label: "Order", value: vars.orderNumber });
  }
  if (vars.role) {
    rows.push({ label: "Role", value: vars.role });
  }
  return rows.length ? rows : undefined;
}
