import { pool } from "../config/db";

export interface MaintenanceRow {
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
  due_date: Date;
  status: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceWithDetails extends MaintenanceRow {
  flat_number: string;
  block: string | null;
  resident_name: string;
  resident_email: string;
  paid_amount: number | null;
  payment_method: string | null;
  payment_date: Date | null;
  transaction_id: string | null;
  receipt_number: string | null;
  payment_id: number | null;
}

const SELECT_WITH_DETAILS = `
  SELECT m.*,
    f.flat_number, f.block,
    u.name AS resident_name, u.email AS resident_email,
    p.paid_amount, p.payment_method, p.payment_date, p.transaction_id, p.receipt_number,
    p.id AS payment_id
  FROM maintenance m
  JOIN flats f ON m.flat_id = f.id
  JOIN residents r ON m.resident_id = r.id
  JOIN users u ON r.user_id = u.id
  LEFT JOIN payments p ON p.bill_id = m.id
`;

export const findAll = async (): Promise<MaintenanceWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} ORDER BY m.created_at DESC`
  );
  return rows as MaintenanceWithDetails[];
};

export const findById = async (id: number): Promise<MaintenanceWithDetails | null> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE m.id = $1`,
    [id]
  );
  return (rows[0] as MaintenanceWithDetails) ?? null;
};

export const findByFlatId = async (flatId: number): Promise<MaintenanceWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE m.flat_id = $1 ORDER BY m.created_at DESC`,
    [flatId]
  );
  return rows as MaintenanceWithDetails[];
};

export const findByResidentId = async (residentId: number): Promise<MaintenanceWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE m.resident_id = $1 ORDER BY m.created_at DESC`,
    [residentId]
  );
  return rows as MaintenanceWithDetails[];
};

export const findDuplicate = async (
  flatId: number,
  billingMonth: number,
  billingYear: number,
  excludeId?: number
): Promise<MaintenanceRow | null> => {
  let query = `SELECT * FROM maintenance WHERE flat_id = $1 AND billing_month = $2 AND billing_year = $3`;
  const params: (number | string)[] = [flatId, billingMonth, billingYear];
  if (excludeId) {
    query += ` AND id != $4`;
    params.push(excludeId);
  }
  const { rows } = await pool.query(query, params);
  return (rows[0] as MaintenanceRow) ?? null;
};

export const create = async (data: {
  flat_id: number;
  resident_id: number;
  billing_month: number;
  billing_year: number;
  maintenance_amount: number;
  additional_charges: number;
  late_fee: number;
  total_amount: number;
  due_date: Date;
  status: string;
  description: string | null;
}): Promise<MaintenanceRow> => {
  const { rows } = await pool.query(
    `INSERT INTO maintenance (flat_id, resident_id, billing_month, billing_year, maintenance_amount, additional_charges, late_fee, total_amount, remaining_amount, due_date, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11) RETURNING *`,
    [
      data.flat_id, data.resident_id, data.billing_month, data.billing_year,
      data.maintenance_amount, data.additional_charges, data.late_fee,
      data.total_amount, data.due_date, data.status, data.description,
    ]
  );
  return rows[0] as MaintenanceRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<MaintenanceRow, "id" | "created_at" | "updated_at">>
): Promise<MaintenanceRow | null> => {
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
    `UPDATE maintenance SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as MaintenanceRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM maintenance WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};

export const getStats = async (): Promise<{
  total_bills: number;
  paid_bills: number;
  unpaid_bills: number;
  overdue_bills: number;
  total_amount: number;
  total_paid: number;
  total_outstanding: number;
}> => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int AS total_bills,
      COUNT(*) FILTER (WHERE status = 'PAID')::int AS paid_bills,
      COUNT(*) FILTER (WHERE status IN ('UNPAID', 'PENDING'))::int AS unpaid_bills,
      COUNT(*) FILTER (WHERE status = 'OVERDUE')::int AS overdue_bills,
      COALESCE(SUM(total_amount), 0)::float AS total_amount,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'PAID'), 0)::float AS total_paid,
      COALESCE(SUM(total_amount) FILTER (WHERE status != 'PAID'), 0)::float AS total_outstanding
    FROM maintenance
  `);
  return rows[0];
};
