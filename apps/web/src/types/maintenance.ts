export interface Maintenance {
  id: number;
  flat_id: number;
  amount: number;
  billing_period: string;
  description: string | null;
  due_date: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenance {
  flat_id: number;
  amount: number;
  billing_period: string;
  description?: string;
  due_date: string;
}

export interface UpdateMaintenance {
  amount?: number;
  billing_period?: string;
  description?: string;
  due_date?: string;
  status?: "PENDING" | "PAID" | "OVERDUE";
}
