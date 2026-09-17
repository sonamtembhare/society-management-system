import { z } from "zod";

export const createResidentSchema = z.object({
  user_id: z.number().int().positive("Please select a user"),
  flat_id: z.number().int().positive("Please select a flat"),
  phone: z.string().max(20).optional().or(z.literal("")),
  emergency_contact: z.string().max(20).optional().or(z.literal("")),
  moving_date: z.string().optional().or(z.literal("")),
});

export const updateResidentSchema = z.object({
  flat_id: z.number().int().positive().optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  emergency_contact: z.string().max(20).optional().or(z.literal("")),
  moving_date: z.string().optional().or(z.literal("")),
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
