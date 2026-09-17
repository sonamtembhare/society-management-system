import { pool } from "../config/db";

export interface ComplaintRow {
  id: number;
  resident_id: number;
  title: string;
  description: string;
  category: string | null;
  status: string;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<ComplaintRow[]> => {
  const { rows } = await pool.query("SELECT * FROM complaints ORDER BY created_at DESC");
  return rows as ComplaintRow[];
};

export const findById = async (id: number): Promise<ComplaintRow | null> => {
  const { rows } = await pool.query("SELECT * FROM complaints WHERE id = $1", [id]);
  return (rows[0] as ComplaintRow) ?? null;
};

export const findByResidentId = async (residentId: number): Promise<ComplaintRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM complaints WHERE resident_id = $1 ORDER BY created_at DESC",
    [residentId]
  );
  return rows as ComplaintRow[];
};

export const create = async (
  data: Omit<ComplaintRow, "id" | "created_at" | "updated_at" | "resolved_at">
): Promise<ComplaintRow> => {
  const { rows } = await pool.query(
    `INSERT INTO complaints (resident_id, title, description, category, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.resident_id, data.title, data.description, data.category, data.status]
  );
  return rows[0] as ComplaintRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<ComplaintRow, "id" | "created_at" | "updated_at">>
): Promise<ComplaintRow | null> => {
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
    `UPDATE complaints SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as ComplaintRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM complaints WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
