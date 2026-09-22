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
  facility: string;
  start_time: string | null;
  end_time: string | null;
  attendees: number;
  status: string;
  resident_id: number | null;
  notes: string | null;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: Date | null;
}

export interface EventWithDetails extends EventRow {
  resident_name: string;
  flat_number: string;
  user_email: string;
  user_phone: string | null;
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

export const findBySocietyIdWithDetails = async (societyId: number): Promise<EventWithDetails[]> => {
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS resident_name, f.flat_number, u2.email AS user_email, r.phone AS user_phone
     FROM events e
     LEFT JOIN residents r ON e.resident_id = r.id
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN flats f ON r.flat_id = f.id
     LEFT JOIN users u2 ON e.created_by = u2.id
     WHERE e.society_id = $1
     ORDER BY e.event_date DESC`,
    [societyId]
  );
  return rows as EventWithDetails[];
};

export const findByResidentId = async (residentId: number): Promise<EventRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM events WHERE resident_id = $1 ORDER BY event_date DESC",
    [residentId]
  );
  return rows as EventRow[];
};

export const findByFacilityAndDate = async (
  facility: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number
): Promise<EventRow[]> => {
  let query = `SELECT * FROM events
    WHERE facility = $1
      AND event_date::date = $2::date
      AND status IN ('PENDING', 'APPROVED')
      AND start_time < $4
      AND end_time > $3`;
  const params: unknown[] = [facility, date, startTime, endTime];

  if (excludeId !== undefined) {
    query += ` AND id != $5`;
    params.push(excludeId);
  }

  const { rows } = await pool.query(query, params);
  return rows as EventRow[];
};

export const create = async (
  data: Omit<EventRow, "id" | "created_at" | "updated_at">
): Promise<EventRow> => {
  const { rows } = await pool.query(
    `INSERT INTO events (society_id, title, description, event_date, end_date, location, created_by, facility, start_time, end_time, attendees, status, resident_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
    [
      data.society_id, data.title, data.description, data.event_date, data.end_date,
      data.location, data.created_by, data.facility, data.start_time, data.end_time,
      data.attendees, data.status, data.resident_id, data.notes,
    ]
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
