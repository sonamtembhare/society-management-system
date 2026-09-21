import { pool } from "../config/db";

export interface NoticeRow {
  id: number;
  society_id: number;
  title: string;
  content: string;
  priority: string;
  notice_type: string;
  created_by: number;
  is_active: boolean;
  expiry_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<NoticeRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM notices WHERE is_active = true AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY created_at DESC"
  );
  return rows as NoticeRow[];
};

export const findAllForAdmin = async (): Promise<NoticeRow[]> => {
  const { rows } = await pool.query("SELECT * FROM notices ORDER BY created_at DESC");
  return rows as NoticeRow[];
};

export const findById = async (id: number): Promise<NoticeRow | null> => {
  const { rows } = await pool.query("SELECT * FROM notices WHERE id = $1", [id]);
  return (rows[0] as NoticeRow) ?? null;
};

export const findBySocietyId = async (societyId: number): Promise<NoticeRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM notices WHERE society_id = $1 AND is_active = true AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY created_at DESC",
    [societyId]
  );
  return rows as NoticeRow[];
};

export const create = async (
  data: Omit<NoticeRow, "id" | "created_at" | "updated_at" | "is_active">
): Promise<NoticeRow> => {
  const { rows } = await pool.query(
    `INSERT INTO notices (society_id, title, content, priority, notice_type, created_by, expiry_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.society_id, data.title, data.content, data.priority, data.notice_type, data.created_by, data.expiry_date]
  );
  return rows[0] as NoticeRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<NoticeRow, "id" | "created_at" | "updated_at">>
): Promise<NoticeRow | null> => {
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
    `UPDATE notices SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as NoticeRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM notices WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
