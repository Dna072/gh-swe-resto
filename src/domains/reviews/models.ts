import type { Timestamped } from "@/domains/shared/types";

export const REVIEW_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface Review extends Timestamped {
  id: string;
  restaurantId: string;
  orderId: string;
  customerId: string;
  rating: number;
  comment?: string;
  status: ReviewStatus;
}
