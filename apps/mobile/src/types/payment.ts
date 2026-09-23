export interface Payment {
  id: number;
  bill_id: number;
  payment_method: "ONLINE" | "OFFLINE";
  paid_amount: number;
  payment_date: string;
  transaction_id: string | null;
  receipt_number: string | null;
  note: string | null;
  received_by: number | null;
  status: "PENDING" | "PAID" | "FAILED";
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  created_at: string;
  updated_at: string;
  flat_number?: string;
  resident_name?: string;
  billing_month?: number;
  billing_year?: number;
  total_amount?: number;
  remaining_amount?: number;
  bill_status?: string;
}

export interface CreatePayment {
  bill_id: number;
  payment_method: "ONLINE" | "OFFLINE";
  paid_amount: number;
  transaction_id?: string;
  receipt_number?: string;
  note?: string;
}

export interface UpdatePayment {
  status?: "PENDING" | "PAID" | "FAILED";
  note?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface RazorpayVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  bill_id: number;
}
