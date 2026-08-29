import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import type { PaymentProvider } from "@/domains/payments/provider";
import type {
  CreatePaymentRequest,
  PaymentSession,
  Refund,
  RefundRequest,
  VerifiedWebhook,
  WebhookResult,
} from "@/domains/payments/models";

/**
 * Deterministic sandbox provider for local development and tests.
 * Not a production payment integration.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly providerId = "mock" as const;
  private readonly payments = new Map<string, PaymentSession>();

  constructor(private readonly webhookSecret = "mock-webhook-secret") {}

  async createPayment(request: CreatePaymentRequest): Promise<PaymentSession> {
    const providerPaymentId = `mock_${request.idempotencyKey}`;
    const existing = this.payments.get(providerPaymentId);
    if (existing) {
      return existing;
    }
    const session: PaymentSession = {
      provider: "mock",
      providerPaymentId,
      clientSecret: `secret_${providerPaymentId}`,
      status: "requires_payment",
    };
    this.payments.set(providerPaymentId, session);
    return session;
  }

  async getPayment(providerPaymentId: string): Promise<PaymentSession> {
    const payment = this.payments.get(providerPaymentId);
    if (!payment) {
      throw new AppError("NOT_FOUND", "Payment not found.");
    }
    return payment;
  }

  async refundPayment(request: RefundRequest): Promise<Refund> {
    return {
      refundId: `re_${request.idempotencyKey}`,
      amountOre: request.amountOre ?? 0,
      status: "succeeded",
    };
  }

  async cancelPayment(providerPaymentId: string): Promise<void> {
    const payment = await this.getPayment(providerPaymentId);
    this.payments.set(providerPaymentId, { ...payment, status: "cancelled" });
  }

  async verifyWebhook(payload: string, headers: Record<string, string | undefined>): Promise<VerifiedWebhook> {
    const signature = headers["x-mock-signature"];
    if (!signature) {
      throw new AppError("UNAUTHORIZED", "Missing webhook signature.");
    }
    const expected = createHmac("sha256", this.webhookSecret).update(payload).digest("hex");
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      throw new AppError("UNAUTHORIZED", "Invalid webhook signature.");
    }
    const body = JSON.parse(payload) as {
      eventId?: string;
      providerPaymentId?: string;
      status?: VerifiedWebhook["status"];
      type?: string;
    };
    if (!body.eventId || !body.providerPaymentId || !body.status) {
      throw new AppError("VALIDATION", "Webhook payload is incomplete.");
    }
    return {
      eventId: body.eventId,
      type: body.type ?? "payment",
      providerPaymentId: body.providerPaymentId,
      status: body.status,
      rawType: body.type ?? "payment",
    };
  }

  async handleWebhook(event: VerifiedWebhook): Promise<WebhookResult> {
    const payment = this.payments.get(event.providerPaymentId);
    if (payment) {
      this.payments.set(event.providerPaymentId, { ...payment, status: event.status });
    }
    return { duplicate: false, status: event.status };
  }

  sign(payload: string): string {
    return createHmac("sha256", this.webhookSecret).update(payload).digest("hex");
  }

  succeed(providerPaymentId: string): void {
    const payment = this.payments.get(providerPaymentId);
    if (payment) {
      this.payments.set(providerPaymentId, { ...payment, status: "succeeded" });
    }
  }

  unusedId(): string {
    return newId();
  }
}
