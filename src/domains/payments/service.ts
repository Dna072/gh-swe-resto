import { AppError } from "@/lib/errors";
import type { PaymentProvider } from "./provider";
import type { CreatePaymentRequest, PaymentSession, RefundRequest, VerifiedWebhook } from "./models";

export interface ProcessedWebhookStore {
  has(eventId: string): Promise<boolean>;
  mark(eventId: string): Promise<void>;
}

export class PaymentService {
  constructor(
    private readonly provider: PaymentProvider,
    private readonly webhooks: ProcessedWebhookStore,
  ) {}

  createPayment(request: CreatePaymentRequest): Promise<PaymentSession> {
    if (request.amountOre < 1) {
      throw new AppError("VALIDATION", "Payment amount must be greater than zero.");
    }
    return this.provider.createPayment(request);
  }

  async processWebhook(
    payload: string,
    headers: Record<string, string | undefined>,
  ): Promise<{ duplicate: boolean; event: VerifiedWebhook }> {
    const event = await this.provider.verifyWebhook(payload, headers);
    if (await this.webhooks.has(event.eventId)) {
      return { duplicate: true, event };
    }
    await this.provider.handleWebhook(event);
    await this.webhooks.mark(event.eventId);
    return { duplicate: false, event };
  }

  refund(request: RefundRequest) {
    return this.provider.refundPayment(request);
  }
}
