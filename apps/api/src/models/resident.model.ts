import { pool } from "../config/db";

export interface ResidentRow {
  id: number;
  user_id: number;
  flat_id: number;
  phone: string | null;
  emergency_contact: string | null;
  moving_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleInfo {
  id: number;
  vehicle_number: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  status: string;
}

export interface ResidentWithUser extends ResidentRow {
  user_name: string;
  user_email: string;
  flat_number: string;
  vehicles: VehicleInfo[];
}

export const findVehiclesByResidentId = async (residentId: number): Promise<VehicleInfo[]> => {
  const { rows } = await pool.query(
    "SELECT id, vehicle_number, vehicle_type, brand, model, color, status FROM vehicles WHERE resident_id = $1 AND status = 'ACTIVE' ORDER BY created_at DESC",
    [residentId]
  );
  return rows as VehicleInfo[];
};

export const findAllLight = async (): Promise<{ id: number; user_name: string; flat_id: number }[]> => {
  const { rows } = await pool.query(
    `SELECT r.id, u.name AS user_name, r.flat_id
     FROM residents r
     JOIN users u ON r.user_id = u.id
     ORDER BY u.name`
  );
  return rows as { id: number; user_name: string; flat_id: number }[];
};

export const findAll = async (): Promise<ResidentWithUser[]> => {
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS user_name, u.email AS user_email, f.flat_number
     FROM residents r
     JOIN users u ON r.user_id = u.id
     JOIN flats f ON r.flat_id = f.id
     ORDER BY r.created_at DESC`
  );

  for (const row of rows) {
    row.vehicles = await findVehiclesByResidentId(row.id);
  }

  return rows as ResidentWithUser[];
};

export const findById = async (id: number): Promise<ResidentRow | null> => {
  const { rows } = await pool.query("SELECT * FROM residents WHERE id = $1", [id]);
  return (rows[0] as ResidentRow) ?? null;
};

export const findByUserId = async (userId: number): Promise<ResidentRow | null> => {
  const { rows } = await pool.query("SELECT * FROM residents WHERE user_id = $1", [userId]);
  return (rows[0] as ResidentRow) ?? null;
};

export const findByFlatId = async (flatId: number): Promise<ResidentRow[]> => {
  const { rows } = await pool.query("SELECT * FROM residents WHERE flat_id = $1", [flatId]);
  return rows as ResidentRow[];
};

export const findDetailsById = async (id: number) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.name, u.email, u.role, f.flat_number, f.block, f.floor, s.name as society_name
     FROM residents r
     JOIN users u ON r.user_id = u.id
     JOIN flats f ON r.flat_id = f.id
     JOIN societies s ON f.society_id = s.id
     WHERE r.id = $1`,
    [id]
  );

  if (rows[0]) {
    rows[0].vehicles = await findVehiclesByResidentId(id);
  }

  return rows[0] ?? null;
};

export const create = async (
  data: Omit<ResidentRow, "id" | "created_at" | "updated_at">
): Promise<ResidentRow> => {
  const { rows } = await pool.query(
    `INSERT INTO residents (user_id, flat_id, phone, emergency_contact, moving_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.user_id, data.flat_id, data.phone, data.emergency_contact, data.moving_date]
  );
  return rows[0] as ResidentRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<ResidentRow, "id" | "created_at" | "updated_at">>
): Promise<ResidentRow | null> => {
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
    `UPDATE residents SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as ResidentRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM residents WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
