import { pool } from "../config/db";

export interface FlatRow {
  id: number;
  society_id: number;
  flat_number: string;
  block: string | null;
  floor: number | null;
  type: string | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<FlatRow[]> => {
  const { rows } = await pool.query("SELECT * FROM flats ORDER BY created_at DESC");
  return rows as FlatRow[];
};

export const findById = async (id: number): Promise<FlatRow | null> => {
  const { rows } = await pool.query("SELECT * FROM flats WHERE id = $1", [id]);
  return (rows[0] as FlatRow) ?? null;
};

export const findBySocietyId = async (societyId: number): Promise<FlatRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM flats WHERE society_id = $1 ORDER BY flat_number",
    [societyId]
  );
  return rows as FlatRow[];
};

export const create = async (
  data: Omit<FlatRow, "id" | "created_at" | "updated_at">
): Promise<FlatRow> => {
  const { rows } = await pool.query(
    `INSERT INTO flats (society_id, flat_number, block, floor, type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.society_id, data.flat_number, data.block, data.floor, data.type]
  );
  return rows[0] as FlatRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<FlatRow, "id" | "created_at" | "updated_at">>
): Promise<FlatRow | null> => {
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
    `UPDATE flats SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as FlatRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM flats WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
