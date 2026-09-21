import { pool } from "../config/db";

export interface ComplaintRow {
  id: number;
  resident_id: number;
  title: string;
  description: string;
  category: string | null;
  status: string;
  priority: string;
  images: string[];
  video_url: string | null;
  video_type: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ComplaintWithDetails extends ComplaintRow {
  resident_name: string;
  resident_email: string;
  flat_number: string;
  block: string | null;
  phone: string | null;
}

const SELECT_WITH_DETAILS = `
  SELECT c.*,
    u.name AS resident_name, u.email AS resident_email,
    f.flat_number, f.block,
    r.phone
  FROM complaints c
  JOIN residents r ON c.resident_id = r.id
  JOIN users u ON r.user_id = u.id
  JOIN flats f ON r.flat_id = f.id
`;

const parseComplaint = (r: Record<string, unknown>): ComplaintRow => ({
  id: r.id as number,
  resident_id: r.resident_id as number,
  title: r.title as string,
  description: r.description as string,
  category: r.category as string | null,
  status: r.status as string,
  priority: (r.priority as string) || "NORMAL",
  images: typeof r.images === "string" ? JSON.parse(r.images as string) : (r.images as string[]) || [],
  video_url: (r.video_url as string) || null,
  video_type: (r.video_type as string) || null,
  resolved_at: r.resolved_at as Date | null,
  created_at: r.created_at as Date,
  updated_at: r.updated_at as Date,
});

const parseComplaintWithDetails = (r: Record<string, unknown>): ComplaintWithDetails => ({
  ...parseComplaint(r),
  resident_name: r.resident_name as string,
  resident_email: r.resident_email as string,
  flat_number: r.flat_number as string,
  block: (r.block as string) || null,
  phone: (r.phone as string) || null,
});

export const findAll = async (): Promise<ComplaintWithDetails[]> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} ORDER BY c.created_at DESC`
  );
  return rows.map((r) => parseComplaintWithDetails(r as Record<string, unknown>));
};

export const findById = async (id: number): Promise<ComplaintRow | null> => {
  const { rows } = await pool.query("SELECT * FROM complaints WHERE id = $1", [id]);
  if (!rows[0]) return null;
  return parseComplaint(rows[0] as Record<string, unknown>);
};

export const findByIdWithDetails = async (id: number): Promise<ComplaintWithDetails | null> => {
  const { rows } = await pool.query(
    `${SELECT_WITH_DETAILS} WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  return parseComplaintWithDetails(rows[0] as Record<string, unknown>);
};

export const findByResidentId = async (residentId: number): Promise<ComplaintRow[]> => {
  const { rows } = await pool.query(
    "SELECT * FROM complaints WHERE resident_id = $1 ORDER BY created_at DESC",
    [residentId]
  );
  return rows.map((r) => parseComplaint(r as Record<string, unknown>));
};

export const create = async (
  data: Omit<ComplaintRow, "id" | "created_at" | "updated_at" | "resolved_at">
): Promise<ComplaintRow> => {
  const imagesJson = JSON.stringify(data.images || []);
  const { rows } = await pool.query(
    `INSERT INTO complaints (resident_id, title, description, category, status, priority, images, video_url, video_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      data.resident_id, data.title, data.description, data.category,
      data.status, data.priority || "NORMAL", imagesJson,
      data.video_url || null, data.video_type || null,
    ]
  );
  return parseComplaint(rows[0] as Record<string, unknown>);
};

export const update = async (
  id: number,
  data: Partial<Omit<ComplaintRow, "id" | "created_at" | "updated_at">>
): Promise<ComplaintRow | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (key === "images" && Array.isArray(value)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  }

  if (fields.length === 0) return findById(id);

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE complaints SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  if (!rows[0]) return null;
  return parseComplaint(rows[0] as Record<string, unknown>);
};

export const remove = async (id: number): Promise<boolean> => {
  const { rowCount } = await pool.query("DELETE FROM complaints WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
};
