import type { Membership, Plan } from "./models";

export interface MembershipRepository {
  getByCustomer(restaurantId: string, customerId: string): Promise<Membership | null>;
  getPlan(restaurantId: string, planId: string): Promise<Plan | null>;
}
