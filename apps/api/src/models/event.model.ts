import { pool } from "../config/db";

export interface EventRow {
  id: number;
  society_id: number;
  title: string;
  description: string | null;
  event_date: Date;
  end_date: Date | null;
  location: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<EventRow[]> => {
  const { rows } = await pool.query("SELECT * FROM events ORDER BY event_date DESC");
  return rows as EventRow[];
};

export const findById = async (id: number): Promise<EventRow | null> => {
  const { rows } = await pool.query("SELECT * FROM events WHERE id = $1", [id]);
  return (rows[0] as EventRow) ?? null;
};

export const findBySocietyId = async (societyId: number): Promise<EventRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM events WHERE society_id = $1 ORDER BY event_date DESC",
    [societyId]
  );
  return rows as EventRow[];
};

export const create = async (
  data: Omit<EventRow, "id" | "created_at" | "updated_at">
): Promise<EventRow> => {
  const { rows } = await pool.query(
    `INSERT INTO events (society_id, title, description, event_date, end_date, location, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.society_id, data.title, data.description, data.event_date, data.end_date, data.location, data.created_by]
  );
  return rows[0] as EventRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<EventRow, "id" | "created_at" | "updated_at">>
): Promise<EventRow | null> => {
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
    `UPDATE events SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as EventRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM events WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
