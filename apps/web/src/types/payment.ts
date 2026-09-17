export interface Payment {
  id: number;
  maintenance_id: number;
  resident_id: number;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  transaction_id: string | null;
  status: "PENDING" | "PAID" | "FAILED";
  created_at: string;
  updated_at: string;
}

export interface CreatePayment {
  maintenance_id: number;
  resident_id: number;
  amount: number;
  payment_method?: string;
  transaction_id?: string;
}

export interface UpdatePayment {
  status?: "PENDING" | "PAID" | "FAILED";
  payment_method?: string;
  transaction_id?: string;
}
