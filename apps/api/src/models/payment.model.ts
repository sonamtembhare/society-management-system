import { pool } from "../config/db";
import type { MaintenanceWithDetails } from "./maintenance.model";

export interface PaymentRow {
  id: number;
  bill_id: number;
  payment_method: string;
  paid_amount: number;
  payment_date: Date;
  transaction_id: string | null;
  receipt_number: string | null;
  note: string | null;
  received_by: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaymentWithDetails extends PaymentRow {
  flat_number: string;
  resident_name: string;
  billing_month: number;
  billing_year: number;
  total_amount: number;
  remaining_amount: number;
  bill_status: string;
}

const SELECT_WITH_DETAILS = `
  SELECT p.*,
    f.flat_number,
    u.name AS resident_name,
    m.billing_month, m.billing_year, m.total_amount, m.remaining_amount, m.status AS bill_status
  FROM payments p
  JOIN maintenance m ON p.bill_id = m.id
  JOIN flats f ON m.flat_id = f.id
  JOIN residents r ON m.resident_id = r.id
  JOIN users u ON r.user_id = u.id
`;

export const findAll = async (): Promise<PaymentWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} ORDER BY p.created_at DESC`
  );
  return rows as PaymentWithDetails[];
};

export const findById = async (id: number): Promise<PaymentWithDetails | null> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE p.id = $1`,
    [id]
  );
  return (rows[0] as PaymentWithDetails) ?? null;
};

export const findByBillId = async (billId: number): Promise<PaymentRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM payments WHERE bill_id = $1 ORDER BY created_at DESC",
    [billId]
  );
  return rows as PaymentRow[];
};

export const findByResidentId = async (residentId: number): Promise<PaymentWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE m.resident_id = $1 ORDER BY p.created_at DESC`,
    [residentId]
  );
  return rows as PaymentWithDetails[];
};

export const existsByBillId = async (billId: number): Promise<boolean> => {
  const { rows } = await pool.query(
    "SELECT 1 FROM payments WHERE bill_id = $1 AND status = 'PAID' LIMIT 1",
    [billId]
  );
  return rows.length > 0;
};

export const getTotalPaidByBillId = async (billId: number): Promise<number> => {
  const { rows } = await pool.query(
    "SELECT COALESCE(SUM(paid_amount), 0)::float AS total_paid FROM payments WHERE bill_id = $1 AND status = 'PAID'",
    [billId]
  );
  return (rows[0] as { total_paid: number }).total_paid;
};

export const create = async (data: {
  bill_id: number;
  payment_method: string;
  paid_amount: number;
  transaction_id?: string;
  receipt_number?: string;
  note?: string;
  received_by?: number;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}): Promise<PaymentRow> => {
  const { rows } = await pool.query(
    `INSERT INTO payments (bill_id, payment_method, paid_amount, transaction_id, receipt_number, note, received_by, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PAID') RETURNING *`,
    [
      data.bill_id, data.payment_method, data.paid_amount,
      data.transaction_id ?? null, data.receipt_number ?? null,
      data.note ?? null, data.received_by ?? null,
      data.razorpay_order_id ?? null, data.razorpay_payment_id ?? null,
      data.razorpay_signature ?? null,
    ]
  );
  return rows[0] as PaymentRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<PaymentRow, "id" | "created_at" | "updated_at">>
): Promise<PaymentRow | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE payments SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as PaymentRow) ?? null;
};

export const findUnpaidBills = async (): Promise<MaintenanceWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE m.status IN ('UNPAID', 'PARTIAL', 'OVERDUE') ORDER BY m.billing_year, m.billing_month, f.flat_number`
  );
  return rows as MaintenanceWithDetails[];
};
