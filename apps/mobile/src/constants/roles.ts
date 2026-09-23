export const ROLES = {
  ADMIN: "ADMIN",
  RESIDENT: "RESIDENT",
  SECURITY: "SECURITY",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  RESIDENT: "Resident",
  SECURITY: "Security",
};

export const STATUS_COLORS: Record<string, string> = {
  PAID: "#10B981",
  FAILED: "#EF4444",
  UNPAID: "#EF4444",
  PENDING: "#F59E0B",
  OVERDUE: "#EF4444",
  CANCELLED: "#6B7280",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
  CHECKED_IN: "#3B82F6",
  CHECKED_OUT: "#6B7280",
  EXPECTED: "#F59E0B",
  RESOLVED: "#10B981",
  IN_PROGRESS: "#3B82F6",
  LOW: "#6B7280",
  NORMAL: "#3B82F6",
  HIGH: "#F59E0B",
  URGENT: "#EF4444",
};
