export interface Maintenance {
  id: number;
  flat_id: number;
  resident_id: number;
  billing_month: number;
  billing_year: number;
  maintenance_amount: number;
  additional_charges: number;
  late_fee: number;
  total_amount: number;
  remaining_amount: number;
  due_date: string;
  status: "UNPAID" | "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
  description: string | null;
  created_at: string;
  updated_at: string;
  flat_number?: string;
  block?: string;
  resident_name?: string;
  resident_email?: string;
  paid_amount?: number | null;
  payment_method?: string | null;
  payment_date?: string | null;
  transaction_id?: string | null;
  receipt_number?: string | null;
  payment_id?: number | null;
}

export interface CreateMaintenance {
  flat_ids: number[];
  billing_month: number;
  billing_year: number;
  maintenance_amount: number;
  additional_charges?: number;
  late_fee?: number;
  due_date: string;
  description?: string;
}

export interface UpdateMaintenance {
  maintenance_amount?: number;
  additional_charges?: number;
  late_fee?: number;
  due_date?: string;
  description?: string;
  status?: "UNPAID" | "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
}

export interface MaintenanceStats {
  total_bills: number;
  paid_bills: number;
  unpaid_bills: number;
  overdue_bills: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
}

export interface GenerateLastMonthResponse {
  billingPeriod: { month: string; year: number };
  summary: { totalEligible: number; created: number; skipped: number; failed: number };
  skippedDetails: { flatNumber: string; reason: string }[];
}

export interface ReminderDetail {
  flat_number: string;
  resident_name: string;
  email: string;
  total_amount: number;
  remaining_amount: number;
  billing_month: number;
  billing_year: number;
  status: "SENT" | "FAILED" | "SKIPPED";
  error?: string;
}

export interface SendRemindersResponse {
  sent: number;
  failed: number;
  skipped: number;
  details: ReminderDetail[];
}
