import type { NotificationProvider } from "@/domains/notifications/provider";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { MockEmailNotificationProvider, SmtpEmailNotificationProvider } from "./email-provider";
import { SesEmailNotificationProvider } from "./ses-provider";

export function createEmailNotificationProvider(): NotificationProvider {
  const env = getEnv();
  if (env.EMAIL_PROVIDER === "ses") {
    if (!env.SES_FROM_EMAIL) {
      logger.warn("ses_email_missing_from_address");
      return new MockEmailNotificationProvider();
    }
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      logger.warn("ses_email_missing_credentials_using_default_chain");
    }
    return new SesEmailNotificationProvider(env);
  }
  if (env.EMAIL_PROVIDER === "smtp") {
    return new SmtpEmailNotificationProvider();
  }
  return new MockEmailNotificationProvider();
}
