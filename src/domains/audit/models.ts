import type { Role } from "@/lib/security/rbac";

export interface AuditLog {
  id: string;
  actorId?: string;
  role?: Role;
  action: string;
  resource: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export const AUDITED_ACTIONS = [
  "menu.update",
  "menu.price_change",
  "order.transition",
  "order.cancel",
  "order.refund",
  "promotion.write",
  "role.change",
  "inventory.adjust",
  "print.enqueue",
  "auth.staff_login",
] as const;
