import { AppError } from "@/lib/errors";
import { newId } from "@/lib/ids";
import { authorizationService } from "@/domains/auth/authorization-service";
import type { Actor } from "@/domains/auth/models";
import type { Order } from "@/domains/orders/models";
import type { Review } from "./models";
import type { ReviewRepository } from "./repository";

export class ReviewService {
  constructor(private readonly reviews: ReviewRepository) {}

  async submit(actor: Actor, order: Order, input: { rating: number; comment?: string }): Promise<Review> {
    if (!actor.uid) {
      throw new AppError("UNAUTHORIZED", "Sign in to leave a review.");
    }
    if (order.customerId !== actor.uid) {
      throw new AppError("FORBIDDEN", "You can only review your own orders.");
    }
    if (order.orderStatus !== "DELIVERED") {
      throw new AppError("INVALID_TRANSITION", "You can review an order after it has been delivered.");
    }
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new AppError("VALIDATION", "Choose a rating from 1 to 5.");
    }
    const existing = await this.reviews.getByOrder(order.id);
    if (existing) {
      throw new AppError("CONFLICT", "You have already reviewed this order.");
    }
    const now = new Date().toISOString();
    return this.reviews.create({
      id: newId(),
      restaurantId: order.restaurantId,
      orderId: order.id,
      customerId: actor.uid,
      rating: input.rating,
      comment: input.comment?.trim() || undefined,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    });
  }

  async listForCustomer(actor: Actor): Promise<Review[]> {
    if (!actor.uid) {
      throw new AppError("UNAUTHORIZED", "Sign in is required.");
    }
    return this.reviews.listByCustomer(actor.uid);
  }

  async moderate(actor: Actor, reviewId: string, status: Review["status"]): Promise<Review> {
    authorizationService.requirePermission(actor, "reviews:moderate");
    const review = await this.reviews.getById(reviewId);
    if (!review) {
      throw new AppError("NOT_FOUND", "Review not found.");
    }
    return this.reviews.update({ ...review, status, updatedAt: new Date().toISOString() });
  }
}
