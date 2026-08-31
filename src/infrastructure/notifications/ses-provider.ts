import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { NotificationProvider } from "@/domains/notifications/provider";
import type { NotificationMessage } from "@/domains/notifications/models";
import { logger } from "@/lib/logging/logger";
import type { AppEnv } from "@/lib/env";
import { withPremiumHtml } from "./email-provider";

export class SesEmailNotificationProvider implements NotificationProvider {
  readonly channel = "email" as const;
  private readonly client: SESv2Client;
  private readonly from: string;
  private readonly configurationSet?: string;

  constructor(env: AppEnv) {
    this.client = new SESv2Client({
      region: env.AWS_SES_REGION ?? "eu-north-1",
      ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
    const name = env.SES_FROM_NAME ?? "Meridian Fusion Cuisine";
    const email = env.SES_FROM_EMAIL ?? "orders@mfcuisine.se";
    this.from = `${name} <${email}>`;
    this.configurationSet = env.SES_CONFIGURATION_SET;
  }

  async send(raw: NotificationMessage): Promise<void> {
    const message = withPremiumHtml(raw);
    await this.client.send(
      new SendEmailCommand({
        FromEmailAddress: this.from,
        Destination: { ToAddresses: [message.to] },
        ConfigurationSetName: this.configurationSet,
        Content: {
          Simple: {
            Subject: { Data: message.subject ?? "Meridian Fusion Cuisine", Charset: "UTF-8" },
            Body: {
              Html: { Data: message.html ?? message.body, Charset: "UTF-8" },
              Text: { Data: message.body, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
    logger.info("ses_email_sent", { event: message.event, orderId: message.orderId });
  }
}
