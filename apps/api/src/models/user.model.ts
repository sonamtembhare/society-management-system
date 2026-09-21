import { pool } from "../config/db";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export type SafeUser = Omit<UserRow, "password_hash">;

export const findByEmail = async (
  email: string
): Promise<UserRow | null> => {
  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return (rows[0] as UserRow) ?? null;
};

export const findById = async (
  id: number
): Promise<SafeUser | null> => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at, u.updated_at,
            COALESCE(u.phone, r.phone) AS phone
     FROM users u
     LEFT JOIN residents r ON r.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );
  return (rows[0] as SafeUser) ?? null;
};

export const createUser = async (
  name: string,
  email: string,
  passwordHash: string,
  role: string
): Promise<SafeUser> => {
  const { rows } = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at, updated_at",
    [name, email, passwordHash, role]
  );
  return rows[0] as SafeUser;
};
