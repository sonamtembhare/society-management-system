import { z } from "zod";

export const createNoticeSchema = z.object({
  society_id: z.number().int().positive("Valid society ID is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(10, "Content must be at least 10 characters"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  notice_type: z.enum(["MAINTENANCE", "MEETING", "GENERAL", "IMPORTANT"]).optional(),
  expiry_date: z.string().optional(),
});

export const updateNoticeSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  notice_type: z.enum(["MAINTENANCE", "MEETING", "GENERAL", "IMPORTANT"]).optional(),
  is_active: z.boolean().optional(),
  expiry_date: z.string().optional(),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
