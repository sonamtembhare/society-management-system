import { z } from "zod";

export const createResidentSchema = z.object({
  user_id: z.number().int().positive("Valid user ID is required"),
  flat_id: z.number().int().positive("Valid flat ID is required"),
  phone: z.string().max(20).optional(),
  emergency_contact: z.string().max(20).optional(),
  moving_date: z.string().optional(),
});

export const updateResidentSchema = createResidentSchema.partial();

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
