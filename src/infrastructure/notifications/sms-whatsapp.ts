import { AppError } from "@/lib/errors";
import type { NotificationProvider } from "@/domains/notifications/provider";

export class SmsNotificationProvider implements NotificationProvider {
  readonly channel = "sms" as const;

  async send(): Promise<void> {
    throw new AppError("INTERNAL", "SMS notifications are not implemented in V1.");
  }
}

export class WhatsAppNotificationProvider implements NotificationProvider {
  readonly channel = "whatsapp" as const;

  async send(): Promise<void> {
    throw new AppError("INTERNAL", "WhatsApp notifications are not implemented in V1.");
  }
}
