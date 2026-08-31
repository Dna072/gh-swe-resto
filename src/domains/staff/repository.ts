import type { StaffUser } from "@/domains/auth/models";

export interface StaffUserRepository {
  getByUid(uid: string): Promise<StaffUser | null>;
  getByEmail(email: string): Promise<StaffUser | null>;
  listByRestaurant(restaurantId: string): Promise<StaffUser[]>;
  save(user: StaffUser): Promise<StaffUser>;
}
