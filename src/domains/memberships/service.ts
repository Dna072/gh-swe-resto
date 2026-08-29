import type { MembershipRepository } from "./repository";
import type { LoyaltyPreview, Membership } from "./models";

export class MembershipService {
  constructor(private readonly memberships: MembershipRepository) {}

  async getMembership(restaurantId: string, customerId: string): Promise<Membership | null> {
    return this.memberships.getByCustomer(restaurantId, customerId);
  }

  isActive(membership: Membership | null): boolean {
    return membership?.status === "ACTIVE";
  }

  previewLoyalty(): LoyaltyPreview {
    return { pointsBalance: 0, pendingRewards: 0 };
  }
}
