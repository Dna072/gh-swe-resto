import { logger } from "@/lib/logging/logger";
import type { NotificationDedupStore, NotificationProvider } from "./provider";
import { NOTIFICATION_COPY, type NotificationEvent, type NotificationMessage } from "./models";
import { withPremiumHtml } from "@/infrastructure/notifications/email-provider";

export type NotifyInput = Omit<NotificationMessage, "subject" | "body" | "channel" | "html"> & {
  to: string;
  subject?: string;
  body?: string;
  html?: string;
  vars?: Record<string, string>;
};

export class NotificationService {
  constructor(
    private readonly providers: NotificationProvider[],
    private readonly dedup: NotificationDedupStore,
  ) {}

  async notify(input: NotifyInput): Promise<void> {
    if (await this.dedup.seen(input.idempotencyKey)) {
      return;
    }
    const copy = NOTIFICATION_COPY[input.event as NotificationEvent];
    const email = this.providers.find((provider) => provider.channel === "email");
    if (!email) {
      logger.warn("No email notification provider configured", { event: input.event });
      return;
    }
    const message = withPremiumHtml({
      ...input,
      channel: "email",
      subject: input.subject ?? copy.subject,
      body: input.body ?? copy.body,
    });
    await email.send(message);
    await this.dedup.mark(input.idempotencyKey);
  }
}
