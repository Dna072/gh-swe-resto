import { describe, expect, it } from "vitest";
import type { Order } from "@/domains/orders/models";
import { InMemoryReviewRepository } from "@/infrastructure/memory/supporting-repositories";
import { createMemoryState } from "@/infrastructure/memory/state";
import { ReviewService } from "./service";

const delivered = {
  id: "o1",
  restaurantId: "uppsala-main",
  publicOrderNumber: "GH1001",
  accessTokenHash: "hash",
  customerId: "c1",
  items: [],
  subtotalOre: 12900,
  deliveryFeeOre: 0,
  discountTotalOre: 0,
  taxTotalOre: 0,
  totalOre: 12900,
  currency: "SEK" as const,
  paymentStatus: "PAID" as const,
  orderStatus: "DELIVERED" as const,
  deliveryStatus: "DELIVERED" as const,
  deliveryAddressSnapshot: { line1: "A", postalCode: "75320", city: "Uppsala", country: "SE" },
  customerSnapshot: { name: "Ama", email: "a@b.c", phone: "1", customerId: "c1" },
  idempotencyKey: "k",
  schemaVersion: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as Order;

describe("ReviewService", () => {
  it("accepts one review per delivered order from the owner", async () => {
    const service = new ReviewService(new InMemoryReviewRepository(createMemoryState()));
    const actor = { uid: "c1", role: "CUSTOMER" as const };
    const review = await service.submit(actor, delivered, { rating: 5, comment: "Perfect jollof." });
    expect(review.status).toBe("PENDING");
    await expect(service.submit(actor, delivered, { rating: 4 })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("rejects reviews before delivery", async () => {
    const service = new ReviewService(new InMemoryReviewRepository(createMemoryState()));
    await expect(
      service.submit({ uid: "c1", role: "CUSTOMER" }, { ...delivered, orderStatus: "PREPARING" }, { rating: 5 }),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
});
