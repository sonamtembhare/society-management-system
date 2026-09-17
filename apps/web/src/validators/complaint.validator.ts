import { z } from "zod";

export const createComplaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().max(50).optional().or(z.literal("")),
});

export const updateComplaintSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().max(50).optional().or(z.literal("")),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"]).optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
