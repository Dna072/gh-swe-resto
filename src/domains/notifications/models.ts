export const NOTIFICATION_EVENTS = [
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_PACKED",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "PAYMENT_FAILED",
  "ORDER_CANCELLED",
  "DELIVERY_DELAYED",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];
export type NotificationChannel = "email" | "sms" | "whatsapp";

export interface NotificationMessage {
  event: NotificationEvent;
  channel: NotificationChannel;
  to: string;
  subject?: string;
  body: string;
  orderId: string;
  idempotencyKey: string;
}

export const NOTIFICATION_COPY: Record<NotificationEvent, { subject: string; body: string }> = {
  ORDER_CONFIRMED: {
    subject: "Your order is in!",
    body: "Your order is in! 🇬🇭 We have received your payment and the kitchen will start soon.",
  },
  ORDER_PREPARING: {
    subject: "Your food is being prepared",
    body: "Your food is being prepared.",
  },
  ORDER_PACKED: {
    subject: "Packed and ready",
    body: "Your order is packed and ready for pickup.",
  },
  COURIER_ASSIGNED: {
    subject: "A courier is on the way to us",
    body: "A courier has been assigned to your order.",
  },
  OUT_FOR_DELIVERY: {
    subject: "Your Ghanaian feast is on the way",
    body: "Your Ghanaian feast is on the way.",
  },
  DELIVERED: {
    subject: "Enjoy your meal!",
    body: "Enjoy your meal! 🇬🇭",
  },
  PAYMENT_FAILED: {
    subject: "We could not complete your payment",
    body: "Payment did not go through. You can try again from your order page.",
  },
  ORDER_CANCELLED: {
    subject: "Your order was cancelled",
    body: "Your order was cancelled. If you were charged, a refund will follow.",
  },
  DELIVERY_DELAYED: {
    subject: "Your delivery is delayed",
    body: "Your delivery is taking longer than expected. We are following up.",
  },
};
