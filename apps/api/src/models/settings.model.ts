import { pool } from "../config/db";

export interface SettingRow {
  id: number;
  key: string;
  value: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export const findAll = async (): Promise<SettingRow[]> => {
  const { rows } = await pool.query("SELECT * FROM settings ORDER BY id");
  return rows as SettingRow[];
};

export const findByKey = async (key: string): Promise<SettingRow | null> => {
  const { rows } = await pool.query("SELECT * FROM settings WHERE key = $1", [key]);
  return (rows[0] as SettingRow) ?? null;
};

export const findByKeys = async (keys: string[]): Promise<Record<string, string>> => {
  const { rows } = await pool.query(
    "SELECT key, value FROM settings WHERE key = ANY($1)",
    [keys]
  );
  const result: Record<string, string> = {};
  for (const row of rows as SettingRow[]) {
    result[row.key] = row.value;
  }
  return result;
};

export const upsert = async (key: string, value: string, description?: string): Promise<SettingRow> => {
  const { rows } = await pool.query(
    `INSERT INTO settings (key, value, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [key, value, description ?? null]
  );
  return rows[0] as SettingRow;
};

export const upsertMany = async (settings: { key: string; value: string; description?: string }[]): Promise<void> => {
  for (const setting of settings) {
    await upsert(setting.key, setting.value, setting.description);
  }
};
