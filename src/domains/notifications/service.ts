import { logger } from "@/lib/logging/logger";
import type { NotificationDedupStore, NotificationProvider } from "./provider";
import { NOTIFICATION_COPY, type NotificationEvent, type NotificationMessage } from "./models";

export class NotificationService {
  constructor(
    private readonly providers: NotificationProvider[],
    private readonly dedup: NotificationDedupStore,
  ) {}

  async notify(input: Omit<NotificationMessage, "subject" | "body" | "channel"> & { to: string }): Promise<void> {
    if (await this.dedup.seen(input.idempotencyKey)) {
      return;
    }
    const copy = NOTIFICATION_COPY[input.event as NotificationEvent];
    const email = this.providers.find((provider) => provider.channel === "email");
    if (!email) {
      logger.warn("No email notification provider configured", { event: input.event });
      return;
    }
    await email.send({
      ...input,
      channel: "email",
      subject: copy.subject,
      body: copy.body,
    });
    await this.dedup.mark(input.idempotencyKey);
  }
}
