import type {
  CreatePaymentRequest,
  PaymentRecord,
  PaymentSession,
  Refund,
  RefundRequest,
  VerifiedWebhook,
  WebhookResult,
} from "./models";

export interface PaymentProvider {
  readonly providerId: PaymentRecord["provider"];
  createPayment(request: CreatePaymentRequest): Promise<PaymentSession>;
  getPayment(providerPaymentId: string): Promise<PaymentSession>;
  refundPayment(request: RefundRequest): Promise<Refund>;
  cancelPayment(providerPaymentId: string): Promise<void>;
  verifyWebhook(payload: string, headers: Record<string, string | undefined>): Promise<VerifiedWebhook>;
  handleWebhook(event: VerifiedWebhook): Promise<WebhookResult>;
}
