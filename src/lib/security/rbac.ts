export const STAFF_ROLES = [
  "OWNER",
  "MANAGER",
  "KITCHEN",
  "DISPATCHER",
  "FINANCE",
  "MARKETING",
] as const;

export const ROLES = [...STAFF_ROLES, "CUSTOMER"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "orders:read",
  "orders:transition",
  "orders:refund",
  "orders:cancel",
  "orders:print",
  "orders:contact",
  "menu:read",
  "menu:write",
  "inventory:read",
  "inventory:adjust",
  "promotions:read",
  "promotions:write",
  "customers:read",
  "customers:export",
  "payments:read",
  "payments:refund",
  "deliveries:read",
  "deliveries:manage",
  "reports:read",
  "users:read",
  "users:write",
  "audit:read",
  "settings:read",
  "settings:write",
  "reviews:moderate",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  MANAGER: [
    "orders:read",
    "orders:transition",
    "orders:refund",
    "orders:cancel",
    "orders:print",
    "orders:contact",
    "menu:read",
    "menu:write",
    "inventory:read",
    "inventory:adjust",
    "promotions:read",
    "promotions:write",
    "customers:read",
    "customers:export",
    "payments:read",
    "payments:refund",
    "deliveries:read",
    "deliveries:manage",
    "reports:read",
    "users:read",
    "users:write",
    "audit:read",
    "settings:read",
    "settings:write",
    "reviews:moderate",
  ],
  KITCHEN: [
    "orders:read",
    "orders:transition",
    "orders:print",
    "menu:read",
    "inventory:read",
    "inventory:adjust",
  ],
  DISPATCHER: [
    "orders:read",
    "orders:transition",
    "orders:print",
    "orders:contact",
    "deliveries:read",
    "deliveries:manage",
  ],
  FINANCE: [
    "orders:read",
    "orders:refund",
    "customers:read",
    "payments:read",
    "payments:refund",
    "reports:read",
    "promotions:read",
  ],
  MARKETING: [
    "menu:read",
    "promotions:read",
    "promotions:write",
    "reports:read",
    "reviews:moderate",
  ],
};

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

export function isRole(role: string): role is Role {
  return (ROLES as readonly string[]).includes(role);
}

export function permissionsFor(role: Role): readonly Permission[] {
  if (role === "CUSTOMER") {
    return [];
  }
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return permissionsFor(role).includes(permission);
}
