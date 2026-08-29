import type { Ore } from "@/lib/money";
import type { Timestamped } from "@/domains/shared/types";

export type PaymentProviderId = "stripe" | "swish" | "mock";

export type ProviderPaymentStatus =
  | "requires_payment"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface CreatePaymentRequest {
  orderId: string;
  amountOre: Ore;
  currency: "SEK";
  customerEmail: string;
  idempotencyKey: string;
  returnUrl: string;
  metadata?: Record<string, string>;
}

export interface PaymentSession {
  provider: PaymentProviderId;
  providerPaymentId: string;
  clientSecret?: string;
  redirectUrl?: string;
  status: ProviderPaymentStatus;
}

export interface PaymentRecord extends Timestamped {
  id: string;
  orderId: string;
  provider: PaymentProviderId;
  providerPaymentId: string;
  amountOre: Ore;
  refundedOre: Ore;
  currency: "SEK";
  status: ProviderPaymentStatus;
  idempotencyKey: string;
  webhookEventIds: string[];
}

export interface RefundRequest {
  providerPaymentId: string;
  amountOre?: Ore;
  reason?: string;
  idempotencyKey: string;
}

export interface Refund {
  refundId: string;
  amountOre: Ore;
  status: "pending" | "succeeded" | "failed";
}

export interface VerifiedWebhook {
  eventId: string;
  type: string;
  providerPaymentId: string;
  status: ProviderPaymentStatus;
  rawType: string;
}

export interface WebhookResult {
  duplicate: boolean;
  orderId?: string;
  status: ProviderPaymentStatus;
}
