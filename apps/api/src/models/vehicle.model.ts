import { pool } from "../config/db";

export interface VehicleRow {
  id: number;
  resident_id: number;
  vehicle_number: string;
  vehicle_type: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<VehicleRow[]> => {
  const { rows } = await pool.query("SELECT * FROM vehicles ORDER BY created_at DESC");
  return rows as VehicleRow[];
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

export const create = async (
  data: Omit<VehicleRow, "id" | "created_at" | "updated_at">
): Promise<VehicleRow> => {
  const { rows } = await pool.query(
    `INSERT INTO vehicles (resident_id, vehicle_number, vehicle_type, brand, model, color)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.resident_id, data.vehicle_number, data.vehicle_type, data.brand, data.model, data.color]
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

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM vehicles WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
