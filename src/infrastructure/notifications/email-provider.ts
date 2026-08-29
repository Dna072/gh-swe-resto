import { logger } from "@/lib/logging/logger";
import type { NotificationProvider } from "@/domains/notifications/provider";
import type { NotificationMessage } from "@/domains/notifications/models";

export class MockEmailNotificationProvider implements NotificationProvider {
  readonly channel = "email" as const;
  readonly sent: NotificationMessage[] = [];

  async send(message: NotificationMessage): Promise<void> {
    this.sent.push(message);
    logger.info("Mock email queued", { event: message.event, orderId: message.orderId });
  }
}

export class SmtpEmailNotificationProvider implements NotificationProvider {
  readonly channel = "email" as const;

  async send(message: NotificationMessage): Promise<void> {
    logger.info("SMTP provider is a Phase 9 concern; message not sent", {
      event: message.event,
      orderId: message.orderId,
    });
  }
}
