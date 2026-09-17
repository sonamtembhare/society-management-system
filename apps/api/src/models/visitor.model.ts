import { pool } from "../config/db";

export interface VisitorRow {
  id: number;
  resident_id: number;
  flat_id: number;
  visitor_name: string;
  visitor_phone: string;
  purpose: string | null;
  vehicle_number: string | null;
  status: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  approved_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<VisitorRow[]> => {
  const { rows } = await pool.query("SELECT * FROM visitors ORDER BY created_at DESC");
  return rows as VisitorRow[];
};

export const findById = async (id: number): Promise<VisitorRow | null> => {
  const { rows } = await pool.query("SELECT * FROM visitors WHERE id = $1", [id]);
  return (rows[0] as VisitorRow) ?? null;
};

export const findByFlatId = async (flatId: number): Promise<VisitorRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM visitors WHERE flat_id = $1 ORDER BY created_at DESC",
    [flatId]
  );
  return rows as VisitorRow[];
};

export const findByResidentId = async (residentId: number): Promise<VisitorRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM visitors WHERE resident_id = $1 ORDER BY created_at DESC",
    [residentId]
  );
  return rows as VisitorRow[];
};

export const create = async (
  data: Omit<VisitorRow, "id" | "created_at" | "updated_at" | "check_in_time" | "check_out_time" | "approved_by">
): Promise<VisitorRow> => {
  const { rows } = await pool.query(
    `INSERT INTO visitors (resident_id, flat_id, visitor_name, visitor_phone, purpose, vehicle_number, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.resident_id, data.flat_id, data.visitor_name, data.visitor_phone, data.purpose, data.vehicle_number, data.status]
  );
  return rows[0] as VisitorRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<VisitorRow, "id" | "created_at" | "updated_at">>
): Promise<VisitorRow | null> => {
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
    `UPDATE visitors SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as VisitorRow) ?? null;
};
