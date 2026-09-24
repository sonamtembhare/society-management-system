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
  visitor_type: string;
  expected_date: string | null;
  expected_time: string | null;
  notes: string | null;
  check_in_time: Date | null;
  check_out_time: Date | null;
  approved_by: number | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface VisitorWithDetails extends VisitorRow {
  resident_name: string;
  flat_number: string;
  resident_phone: string | null;
}

const VISITOR_DETAILS_SELECT = `
  v.*,
  u.name AS resident_name,
  f.flat_number,
  r.phone AS resident_phone
`;

const VISITOR_DETAILS_JOINS = `
  FROM visitors v
  JOIN residents r ON v.resident_id = r.id
  JOIN users u ON r.user_id = u.id
  LEFT JOIN flats f ON v.flat_id = f.id
`;

export const findAllWithDetails = async (): Promise<VisitorWithDetails[]> => {
  const { rows } = await pool.query(
    `SELECT ${VISITOR_DETAILS_SELECT} ${VISITOR_DETAILS_JOINS} ORDER BY v.created_at DESC`
  );
  return rows as VisitorWithDetails[];
};

export const findByResidentIdWithDetails = async (residentId: number): Promise<VisitorWithDetails[]> => {
  const { rows } = await pool.query(
    `SELECT ${VISITOR_DETAILS_SELECT} ${VISITOR_DETAILS_JOINS} WHERE v.resident_id = $1 ORDER BY v.created_at DESC`,
    [residentId]
  );
  return rows as VisitorWithDetails[];
};

export const findByIdWithDetails = async (id: number): Promise<VisitorWithDetails | null> => {
  const { rows } = await pool.query(
    `SELECT ${VISITOR_DETAILS_SELECT} ${VISITOR_DETAILS_JOINS} WHERE v.id = $1`,
    [id]
  );
  return (rows[0] as VisitorWithDetails) ?? null;
};

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

export const findTodayVisitors = async (): Promise<VisitorRow[]> => {
  const { rows } = await pool.query(
    `SELECT * FROM visitors 
     WHERE (expected_date = CURRENT_DATE OR DATE(check_in_time) = CURRENT_DATE OR DATE(created_at) = CURRENT_DATE)
     ORDER BY created_at DESC`
  );
  return rows as VisitorRow[];
};

export const countByStatus = async (): Promise<Record<string, number>> => {
  const { rows } = await pool.query(
    `SELECT status, COUNT(*)::int as count FROM visitors 
     WHERE DATE(created_at) = CURRENT_DATE OR DATE(check_in_time) = CURRENT_DATE
     GROUP BY status`
  );
  const counts: Record<string, number> = { EXPECTED: 0, CHECKED_IN: 0, CHECKED_OUT: 0, CANCELLED: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const row of rows) {
    counts[row.status] = row.count;
  }
  return counts;
};

export const create = async (
  data: Omit<VisitorRow, "id" | "created_at" | "updated_at" | "check_in_time" | "check_out_time" | "approved_by">
): Promise<VisitorRow> => {
  const { rows } = await pool.query(
    `INSERT INTO visitors (resident_id, flat_id, visitor_name, visitor_phone, purpose, vehicle_number, status, visitor_type, expected_date, expected_time, notes, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [data.resident_id, data.flat_id, data.visitor_name, data.visitor_phone, data.purpose, data.vehicle_number, data.status, data.visitor_type, data.expected_date, data.expected_time, data.notes, data.created_by]
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
