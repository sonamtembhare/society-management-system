import { pool } from "../config/db";

export interface SocietyRow {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  email: string | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<SocietyRow[]> => {
  const { rows } = await pool.query("SELECT * FROM societies ORDER BY created_at DESC");
  return rows as SocietyRow[];
};

export const findById = async (id: number): Promise<SocietyRow | null> => {
  const { rows } = await pool.query("SELECT * FROM societies WHERE id = $1", [id]);
  return (rows[0] as SocietyRow) ?? null;
};

export const create = async (
  data: Omit<SocietyRow, "id" | "created_at" | "updated_at">
): Promise<SocietyRow> => {
  const { rows } = await pool.query(
    `INSERT INTO societies (name, address, city, state, pincode, phone, email)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.name, data.address, data.city, data.state, data.pincode, data.phone, data.email]
  );
  return rows[0] as SocietyRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<SocietyRow, "id" | "created_at" | "updated_at">>
): Promise<SocietyRow | null> => {
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
    `UPDATE societies SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as SocietyRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM societies WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
