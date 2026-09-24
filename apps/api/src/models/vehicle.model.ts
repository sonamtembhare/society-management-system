import { pool } from "../config/db";

export interface VehicleRow {
  id: number;
  resident_id: number;
  flat_id: number | null;
  vehicle_number: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  status: string;
  last_entry_at: Date | null;
  last_exit_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface VehicleWithDetails extends VehicleRow {
  resident_name: string;
  resident_mobile: string | null;
  flat_number: string | null;
}

const VEHICLE_DETAILS_SELECT = `
  v.*,
  u.name AS resident_name,
  r.phone AS resident_mobile,
  f.flat_number
`;

const VEHICLE_DETAILS_JOINS = `
  FROM vehicles v
  JOIN residents r ON v.resident_id = r.id
  JOIN users u ON r.user_id = u.id
  LEFT JOIN flats f ON v.flat_id = f.id
`;

export const findAll = async (): Promise<VehicleRow[]> => {
  const { rows } = await pool.query("SELECT * FROM vehicles ORDER BY created_at DESC");
  return rows as VehicleRow[];
};

export const findAllWithDetails = async (): Promise<VehicleWithDetails[]> => {
  const { rows } = await pool.query(
    `SELECT ${VEHICLE_DETAILS_SELECT} ${VEHICLE_DETAILS_JOINS} ORDER BY v.created_at DESC`
  );
  return rows as VehicleWithDetails[];
};

export const findById = async (id: number): Promise<VehicleRow | null> => {
  const { rows } = await pool.query("SELECT * FROM vehicles WHERE id = $1", [id]);
  return (rows[0] as VehicleRow) ?? null;
};

export const findByResidentId = async (residentId: number): Promise<VehicleRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM vehicles WHERE resident_id = $1 ORDER BY created_at DESC",
    [residentId]
  );
  return rows as VehicleRow[];
};

export const findByResidentIdWithDetails = async (residentId: number): Promise<VehicleWithDetails[]> => {
  const { rows } = await pool.query(
    `SELECT ${VEHICLE_DETAILS_SELECT} ${VEHICLE_DETAILS_JOINS} WHERE v.resident_id = $1 ORDER BY v.created_at DESC`,
    [residentId]
  );
  return rows as VehicleWithDetails[];
};

export const findByVehicleNumber = async (vehicleNumber: string): Promise<VehicleRow | null> => {
  const { rows } = await pool.query(
    "SELECT * FROM vehicles WHERE vehicle_number = $1 AND status = 'ACTIVE'",
    [vehicleNumber]
  );
  return (rows[0] as VehicleRow) ?? null;
};

export const searchByQuery = async (query: string): Promise<VehicleWithDetails[]> => {
  const searchTerm = `%${query}%`;
  const { rows } = await pool.query(
    `SELECT ${VEHICLE_DETAILS_SELECT} ${VEHICLE_DETAILS_JOINS}
     WHERE v.vehicle_number ILIKE $1
        OR u.name ILIKE $1
        OR f.flat_number ILIKE $1
        OR r.phone ILIKE $1
     ORDER BY v.created_at DESC`,
    [searchTerm]
  );
  return rows as VehicleWithDetails[];
};

export const searchByQueryForResident = async (query: string, residentId: number): Promise<VehicleWithDetails[]> => {
  const searchTerm = `%${query}%`;
  const { rows } = await pool.query(
    `SELECT ${VEHICLE_DETAILS_SELECT} ${VEHICLE_DETAILS_JOINS}
     WHERE v.resident_id = $2
       AND (v.vehicle_number ILIKE $1
            OR u.name ILIKE $1
            OR f.flat_number ILIKE $1
            OR r.phone ILIKE $1)
     ORDER BY v.created_at DESC`,
    [searchTerm, residentId]
  );
  return rows as VehicleWithDetails[];
};

export const create = async (
  data: Omit<VehicleRow, "id" | "created_at" | "updated_at" | "last_entry_at" | "last_exit_at">
): Promise<VehicleRow> => {
  const { rows } = await pool.query(
    `INSERT INTO vehicles (resident_id, flat_id, vehicle_number, vehicle_type, brand, model, color, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      data.resident_id,
      data.flat_id,
      data.vehicle_number,
      data.vehicle_type,
      data.brand,
      data.model,
      data.color,
      data.status ?? "ACTIVE",
    ]
  );
  return rows[0] as VehicleRow;
};

export const update = async (
  id: number,
  data: Partial<Omit<VehicleRow, "id" | "created_at" | "updated_at">>
): Promise<VehicleRow | null> => {
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
    `UPDATE vehicles SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return (rows[0] as VehicleRow) ?? null;
};

export const recordEntry = async (id: number): Promise<VehicleRow | null> => {
  const { rows } = await pool.query(
    `UPDATE vehicles SET last_entry_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return (rows[0] as VehicleRow) ?? null;
};

export const recordExit = async (id: number): Promise<VehicleRow | null> => {
  const { rows } = await pool.query(
    `UPDATE vehicles SET last_exit_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return (rows[0] as VehicleRow) ?? null;
};

export const deactivate = async (id: number): Promise<VehicleRow | null> => {
  const { rows } = await pool.query(
    `UPDATE vehicles SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
    [id]
  );
  return (rows[0] as VehicleRow) ?? null;
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM vehicles WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
