import { z } from "zod";

export const createFlatSchema = z.object({
  society_id: z.number().int().positive("Valid society ID is required"),
  flat_number: z.string().min(1, "Flat number is required").max(20),
  block: z.string().max(10).optional(),
  floor: z.number().int().min(0).optional(),
  type: z.string().max(20).optional(),
});

export const updateFlatSchema = createFlatSchema.partial();

export type CreateFlatInput = z.infer<typeof createFlatSchema>;
export type UpdateFlatInput = z.infer<typeof updateFlatSchema>;
