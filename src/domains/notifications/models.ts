export const NOTIFICATION_EVENTS = [
  "ACCOUNT_CREATED",
  "PASSWORD_RESET",
  "STAFF_INVITE",
  "ORDER_CONFIRMED",
  "ORDER_PREPARING",
  "ORDER_PACKED",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "PAYMENT_FAILED",
  "ORDER_CANCELLED",
  "ORDER_REFUNDED",
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
  html?: string;
  orderId?: string;
  idempotencyKey: string;
  vars?: Record<string, string>;
}

export type NotificationCopy = {
  subject: string;
  headline: string;
  body: string;
  ctaLabel?: string;
};

export const NOTIFICATION_COPY: Record<NotificationEvent, NotificationCopy> = {
  ACCOUNT_CREATED: {
    subject: "Welcome to Meridian Fusion Cuisine",
    headline: "Your table is reserved — in spirit.",
    body: "Your account is ready. Sign in any time to follow current orders, look back at past meals, and leave a note for the kitchen.",
    ctaLabel: "Open your account",
  },
  PASSWORD_RESET: {
    subject: "Reset your Meridian password",
    headline: "Set a new password",
    body: "Use the button below to choose a new password. If you did not ask for this, you can ignore the message.",
    ctaLabel: "Choose a password",
  },
  STAFF_INVITE: {
    subject: "You are invited to Meridian Fusion Cuisine",
    headline: "Join the kitchen team",
    body: "An owner has invited you to the Meridian Fusion Cuisine staff tools. Set your password to start.",
    ctaLabel: "Set your password",
  },
  ORDER_CONFIRMED: {
    subject: "Your order is in",
    headline: "We have your order",
    body: "Payment is confirmed. The kitchen will start when your slot is due — Ghanaian plates, cooked in Uppsala.",
    ctaLabel: "Follow your order",
  },
  ORDER_PREPARING: {
    subject: "The kitchen has started",
    headline: "Your food is being prepared",
    body: "Pots are on. We will pack as soon as the plate is ready.",
    ctaLabel: "Follow your order",
  },
  ORDER_PACKED: {
    subject: "Packed and ready",
    headline: "Packed and ready",
    body: "Your order is packed and waiting for the courier.",
    ctaLabel: "Follow your order",
  },
  COURIER_ASSIGNED: {
    subject: "A courier is on the way to us",
    headline: "A courier is assigned",
    body: "A courier is heading to the kitchen for your order.",
    ctaLabel: "Track delivery",
  },
  OUT_FOR_DELIVERY: {
    subject: "Your Meridian order is on the way",
    headline: "On the way to you",
    body: "Your order from Meridian Fusion Cuisine has left the kitchen.",
    ctaLabel: "Track delivery",
  },
  DELIVERED: {
    subject: "Enjoy your meal",
    headline: "Enjoy your meal",
    body: "Your order has arrived. If you had an account, you can leave a short review from your order history.",
    ctaLabel: "View your order",
  },
  PAYMENT_FAILED: {
    subject: "We could not complete your payment",
    headline: "Payment did not go through",
    body: "Nothing has been charged. You can try again from your order page.",
    ctaLabel: "Try payment again",
  },
  ORDER_CANCELLED: {
    subject: "Your order was cancelled",
    headline: "This order was cancelled",
    body: "Your order was cancelled. If you were charged, a refund will follow.",
    ctaLabel: "View the order",
  },
  ORDER_REFUNDED: {
    subject: "Your refund is on the way",
    headline: "Refund on the way",
    body: "We have refunded this order. The amount returns to the original payment method.",
    ctaLabel: "View the order",
  },
  DELIVERY_DELAYED: {
    subject: "Your delivery is delayed",
    headline: "Running a little late",
    body: "Your delivery is taking longer than expected. We are following up with the courier.",
    ctaLabel: "Track delivery",
  },
};
