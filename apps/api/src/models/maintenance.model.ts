import { pool } from "../config/db";

export interface MaintenanceRow {
  id: number;
  flat_id: number;
  amount: number;
  billing_period: string;
  description: string | null;
  due_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<MaintenanceRow[]> => {
  const { rows } = await pool.query("SELECT * FROM maintenance ORDER BY created_at DESC");
  return rows as MaintenanceRow[];
};

export const findById = async (id: number): Promise<MaintenanceRow | null> => {
  const { rows } = await pool.query("SELECT * FROM maintenance WHERE id = $1", [id]);
  return (rows[0] as MaintenanceRow) ?? null;
};

export const findByFlatId = async (flatId: number): Promise<MaintenanceRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM maintenance WHERE flat_id = $1 ORDER BY created_at DESC",
    [flatId]
  );
  return rows as MaintenanceRow[];
};

export const findByResidentId = async (residentId: number): Promise<MaintenanceRow[]> => {
  const { rows } = await pool.query(
    `SELECT m.* FROM maintenance m
     JOIN flats f ON m.flat_id = f.id
     JOIN residents r ON r.flat_id = f.id
     WHERE r.id = $1 ORDER BY m.created_at DESC`,
    [residentId]
  );
  return rows as MaintenanceRow[];
};

export const create = async (
  data: Omit<MaintenanceRow, "id" | "created_at" | "updated_at">
): Promise<MaintenanceRow> => {
  const { rows } = await pool.query(
    `INSERT INTO maintenance (flat_id, amount, billing_period, description, due_date, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.flat_id, data.amount, data.billing_period, data.description, data.due_date, data.status]
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
