import type { Review } from "./models";

export interface ReviewRepository {
  getById(reviewId: string): Promise<Review | null>;
  getByOrder(orderId: string): Promise<Review | null>;
  listByCustomer(customerId: string): Promise<Review[]>;
  create(review: Review): Promise<Review>;
  update(review: Review): Promise<Review>;
}
