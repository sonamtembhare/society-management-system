import { z } from "zod";

export const createFlatSchema = z.object({
  society_id: z.number().int().positive("Please select a society"),
  flat_number: z.string().min(1, "Flat number is required").max(20),
  block: z.string().max(10).optional().or(z.literal("")),
  floor: z.number().int().min(0).optional().or(z.null()),
  type: z.string().max(20).optional().or(z.literal("")),
});

export const updateFlatSchema = createFlatSchema.partial();

export type CreateFlatInput = z.infer<typeof createFlatSchema>;
export type UpdateFlatInput = z.infer<typeof updateFlatSchema>;
