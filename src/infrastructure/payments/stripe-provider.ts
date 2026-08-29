import Stripe from "stripe";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import type { PaymentProvider } from "@/domains/payments/provider";
import type {
  CreatePaymentRequest,
  PaymentSession,
  ProviderPaymentStatus,
  Refund,
  RefundRequest,
  VerifiedWebhook,
  WebhookResult,
} from "@/domains/payments/models";

/**
 * Stripe adapter. Treat as sandbox-only until webhook + PaymentIntent
 * flows have been tested against Stripe test mode with real credentials.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly providerId = "stripe" as const;
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createPayment(request: CreatePaymentRequest): Promise<PaymentSession> {
    const intent = await this.stripe.paymentIntents.create(
      {
        amount: request.amountOre,
        currency: request.currency.toLowerCase(),
        receipt_email: request.customerEmail,
        metadata: { orderId: request.orderId, ...request.metadata },
      },
      { idempotencyKey: request.idempotencyKey },
    );
    return {
      provider: "stripe",
      providerPaymentId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: mapStripeStatus(intent.status),
    };
  }

  async getPayment(providerPaymentId: string): Promise<PaymentSession> {
    const intent = await this.stripe.paymentIntents.retrieve(providerPaymentId);
    return {
      provider: "stripe",
      providerPaymentId: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      status: mapStripeStatus(intent.status),
    };
  }

  async refundPayment(request: RefundRequest): Promise<Refund> {
    const refund = await this.stripe.refunds.create(
      {
        payment_intent: request.providerPaymentId,
        amount: request.amountOre,
        reason: request.reason === "duplicate" ? "duplicate" : "requested_by_customer",
      },
      { idempotencyKey: request.idempotencyKey },
    );
    return {
      refundId: refund.id,
      amountOre: refund.amount,
      status: refund.status === "succeeded" ? "succeeded" : refund.status === "failed" ? "failed" : "pending",
    };
  }

  async cancelPayment(providerPaymentId: string): Promise<void> {
    await this.stripe.paymentIntents.cancel(providerPaymentId);
  }

  async verifyWebhook(payload: string, headers: Record<string, string | undefined>): Promise<VerifiedWebhook> {
    const signature = headers["stripe-signature"];
    if (!signature) {
      throw new AppError("UNAUTHORIZED", "Missing Stripe signature.");
    }
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      const object = event.data.object as { id?: string; status?: string };
      return {
        eventId: event.id,
        type: event.type,
        providerPaymentId: object.id ?? "",
        status: mapStripeStatus(object.status ?? "processing"),
        rawType: event.type,
      };
    } catch {
      logger.warn("Stripe webhook verification failed");
      throw new AppError("UNAUTHORIZED", "Invalid Stripe webhook signature.");
    }
  }

  async handleWebhook(event: VerifiedWebhook): Promise<WebhookResult> {
    return { duplicate: false, status: event.status };
  }
}

function mapStripeStatus(status: string): ProviderPaymentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "canceled":
      return "cancelled";
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "requires_payment";
    case "processing":
      return "processing";
    default:
      return "failed";
  }
}
