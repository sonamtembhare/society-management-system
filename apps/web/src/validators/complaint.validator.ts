import { z } from "zod";

export const createComplaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().max(50).optional().or(z.literal("")),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  images: z.array(z.string()).optional(),
  video_url: z.string().optional().nullable(),
  video_type: z.string().optional().nullable(),
});

export const updateComplaintSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().max(50).optional().or(z.literal("")),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"]).optional(),
  images: z.array(z.string()).optional(),
  video_url: z.string().optional().nullable(),
  video_type: z.string().optional().nullable(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
