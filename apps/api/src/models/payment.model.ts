import { pool } from "../config/db";

export interface PaymentRow {
  id: number;
  maintenance_id: number;
  resident_id: number;
  amount: number;
  payment_date: Date;
  payment_method: string | null;
  transaction_id: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<PaymentRow[]> => {
  const { rows } = await pool.query("SELECT * FROM payments ORDER BY created_at DESC");
  return rows as PaymentRow[];
};

export const findById = async (id: number): Promise<PaymentRow | null> => {
  const { rows } = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
  return (rows[0] as PaymentRow) ?? null;
};

export const findByMaintenanceId = async (maintenanceId: number): Promise<PaymentRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM payments WHERE maintenance_id = $1 ORDER BY created_at DESC",
    [maintenanceId]
  );
  return rows as PaymentRow[];
};

export const findByResidentId = async (residentId: number): Promise<PaymentRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM payments WHERE resident_id = $1 ORDER BY created_at DESC",
    [residentId]
  );
  return rows as PaymentRow[];
};

export const create = async (
  data: Omit<PaymentRow, "id" | "created_at" | "updated_at" | "payment_date">
): Promise<PaymentRow> => {
  const { rows } = await pool.query(
    `INSERT INTO payments (maintenance_id, resident_id, amount, payment_method, transaction_id, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.maintenance_id, data.resident_id, data.amount, data.payment_method, data.transaction_id, data.status]
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
